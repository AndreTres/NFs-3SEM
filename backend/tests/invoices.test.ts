import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { truncateForTests } from './helpers/db';
import { requestApp } from './helpers/request';
import { createTestUser, createAuthenticatedUser } from './helpers/auth';
import { createTestInvoice, seedInvoicesDataset } from './helpers/invoices';

beforeEach(async () => {
  await truncateForTests();
});

describe('Invoices', () => {
  describe('POST /invoices', () => {
    it('cria invoice com sucesso', async () => {
      const { user, headers } = await createAuthenticatedUser();

      const payload = {
        number: 'INV-001',
        amount: 100,
        issueDate: '2026-01-01T00:00:00.000Z',
        dueDate: '2026-02-01T00:00:00.000Z',
        status: 'PENDING',
        type: 'INCOME',
      };

      const res = await requestApp()
        .post('/invoices')
        .set(headers)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
    });

    it('retorna 400 para payload inválido', async () => {
      const { headers } = await createAuthenticatedUser();

      const res = await requestApp()
        .post('/invoices')
        .set(headers)
        .send({
          number: 'INV-001',
          amount: '100',
          issueDate: '2026-01-01T00:00:00.000Z',
          dueDate: '2026-02-01T00:00:00.000Z',
          status: 'PENDING',
          type: 'INCOME',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('retorna 400 quando dueDate é menor que issueDate', async () => {
      const { headers } = await createAuthenticatedUser();

      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);

      const res = await requestApp()
        .post('/invoices')
        .set(headers)
        .send({
          number: 'INV-002',
          amount: 100,
          issueDate: hoje.toISOString(),
          dueDate: ontem.toISOString(),
          status: 'PENDING',
          type: 'INCOME',
        });

      expect(res.status).toBe(400);
    });

    it('invoice criada pertence ao usuário autenticado', async () => {
      const { user, headers } = await createAuthenticatedUser();

      const payload = {
        number: 'INV-003',
        amount: 200,
        issueDate: '2026-01-01T00:00:00.000Z',
        dueDate: '2026-02-01T00:00:00.000Z',
        status: 'PENDING',
        type: 'EXPENSE',
      };

      const postRes = await requestApp()
        .post('/invoices')
        .set(headers)
        .send(payload);

      expect(postRes.status).toBe(201);
      const createdId = postRes.body.data.id;

      const getRes = await requestApp()
        .get('/invoices')
        .set(headers);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data).toBeDefined();
      const lista = getRes.body.data;
      expect(Array.isArray(lista)).toBe(true);

      const invoiceNaLista = lista.find((inv: { id: string }) => inv.id === createdId);
      expect(invoiceNaLista).toBeDefined();
      expect(invoiceNaLista.userId).toBe(user.id);
    });

    it('criar invoice duplicada retorna 409', async () => {
      const { headers } = await createAuthenticatedUser();

      await requestApp()
        .post('/invoices')
        .set(headers)
        .send({
          number: 'INV-999',
          amount: 100,
          issueDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          status: 'PENDING',
          type: 'INCOME',
        });

      const res = await requestApp()
        .post('/invoices')
        .set(headers)
        .send({
          number: 'INV-999',
          amount: 200,
          issueDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          status: 'PENDING',
          type: 'INCOME',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /invoices', () => {
    it('lista invoices com sucesso', async () => {
      const { user, headers } = await createAuthenticatedUser();

      await createTestInvoice(user.id);
      await createTestInvoice(user.id);

      const res = await requestApp()
        .get('/invoices')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('retorna lista vazia quando não há invoices', async () => {
      const { headers } = await createAuthenticatedUser();

      const res = await requestApp()
        .get('/invoices')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('usuário B não vê invoices do usuário A', async () => {
      const { user: userA } = await createTestUser();
      await createTestInvoice(userA.id);

      const { headers } = await createAuthenticatedUser();

      const res = await requestApp()
        .get('/invoices')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /invoices — query layer', () => {
    it('paginação com limit retorna página 1 e 2 itens', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?page=1&limit=2')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(2);
    });

    it('segunda página retorna 2 itens e meta.page 2', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?page=2&limit=2')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.page).toBe(2);
    });

    it('página vazia retorna data vazio', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?page=10')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('filtro por status PENDING retorna 3 itens', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?status=PENDING')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('filtro por status PAID retorna 2 itens', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?status=PAID')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('filtro por type INCOME retorna 3 itens', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?type=INCOME')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('filtro por type EXPENSE retorna 2 itens', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?type=EXPENSE')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('filtro combinado status PENDING e type INCOME retorna 2 itens', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?status=PENDING&type=INCOME')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('filtro combinado status PAID e type EXPENSE retorna 1 item', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?status=PAID&type=EXPENSE')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('PAID');
      expect(res.body.data[0].type).toBe('EXPENSE');
    });

    it('ordenar por amount retorna valores em ordem crescente', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?sort=amount')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const amounts = res.body.data.map((i: { amount: unknown }) => Number(i.amount));
      expect(amounts).toEqual([100, 200, 300, 400, 500]);
    });

    it('ordenar por amount desc retorna valores em ordem decrescente', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?sort=-amount')
        .set(headers);

      expect(res.status).toBe(200);
      const amounts = res.body.data.map((i: { amount: unknown }) => Number(i.amount));
      expect(amounts).toEqual([500, 400, 300, 200, 100]);
    });

    it('retorna 400 para status inválido', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?status=INVALID')
        .set(headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('retorna 400 para limit inválido', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?limit=abc')
        .set(headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('retorna 400 para sort inválido', async () => {
      const { user, headers } = await createAuthenticatedUser();
      await seedInvoicesDataset(user.id);

      const res = await requestApp()
        .get('/invoices?sort=unknown')
        .set(headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('page negativa retorna 400', async () => {
      const { headers } = await createAuthenticatedUser();

      const res = await requestApp()
        .get('/invoices?page=-1')
        .set(headers);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /invoices — analytics', () => {
    describe('/summary', () => {
      it('summary retorna totais corretos', async () => {
        const { user, headers } = await createAuthenticatedUser();
        await seedInvoicesDataset(user.id);

        const res = await requestApp()
          .get('/invoices/summary')
          .set(headers);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.income).toBe(900);
        expect(res.body.data.expenses).toBe(600);
        expect(res.body.data.balance).toBe(300);
      });

      it('summary com dataset vazio', async () => {
        const { headers } = await createAuthenticatedUser();

        const res = await requestApp()
          .get('/invoices/summary')
          .set(headers);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.income).toBe(0);
        expect(res.body.data.expenses).toBe(0);
        expect(res.body.data.balance).toBe(0);
      });
    });

    describe('/stats', () => {
      it('stats retorna contagem correta por status', async () => {
        const { user, headers } = await createAuthenticatedUser();
        await seedInvoicesDataset(user.id);

        const res = await requestApp()
          .get('/invoices/stats')
          .set(headers);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.PENDING).toBe(3);
        expect(res.body.data.PAID).toBe(2);
      });

      it('stats com dataset vazio', async () => {
        const { headers } = await createAuthenticatedUser();

        const res = await requestApp()
          .get('/invoices/stats')
          .set(headers);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.PENDING).toBe(0);
        expect(res.body.data.PAID).toBe(0);
      });
    });

    describe('/monthly', () => {
      it('monthly retorna array com métricas', async () => {
        const { user, headers } = await createAuthenticatedUser();
        await seedInvoicesDataset(user.id);

        const res = await requestApp()
          .get('/invoices/monthly')
          .set(headers);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        const item = res.body.data[0];
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('income');
        expect(item).toHaveProperty('expenses');
      });

      it('monthly com dataset vazio retorna array vazio', async () => {
        const { headers } = await createAuthenticatedUser();

        const res = await requestApp()
          .get('/invoices/monthly')
          .set(headers);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
      });
    });
  });

  describe('GET /invoices/:id', () => {
    it('busca invoice por id com sucesso', async () => {
      const { user, headers } = await createAuthenticatedUser();
      const invoice = await createTestInvoice(user.id);

      const res = await requestApp()
        .get(`/invoices/${invoice.id}`)
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(invoice.id);
    });

    it('retorna 404 para invoice inexistente', async () => {
      const { headers } = await createAuthenticatedUser();
      const idInexistente = randomUUID();

      const res = await requestApp()
        .get(`/invoices/${idInexistente}`)
        .set(headers);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('retorna 404 quando invoice pertence a outro usuário', async () => {
      const { user: userA } = await createTestUser();
      const invoiceA = await createTestInvoice(userA.id);

      const { headers } = await createAuthenticatedUser();

      const res = await requestApp()
        .get(`/invoices/${invoiceA.id}`)
        .set(headers);

      expect(res.status).toBe(404);
    });

    it('retorna 400 para UUID inválido', async () => {
      const { headers } = await createAuthenticatedUser();

      const res = await requestApp()
        .get('/invoices/abc')
        .set(headers);

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /invoices/:id', () => {
    it('atualiza invoice com sucesso', async () => {
      const { user, headers } = await createAuthenticatedUser();
      const invoice = await createTestInvoice(user.id);

      const res = await requestApp()
        .patch(`/invoices/${invoice.id}`)
        .set(headers)
        .send({ amount: 200, status: 'PAID' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.amount)).toBe(200);
      expect(res.body.data.status).toBe('PAID');
    });

    it('retorna 404 quando invoice não existe', async () => {
      const { headers } = await createAuthenticatedUser();
      const idInexistente = randomUUID();

      const res = await requestApp()
        .patch(`/invoices/${idInexistente}`)
        .set(headers)
        .send({ amount: 200 });

      expect(res.status).toBe(404);
    });

    it('retorna 400 para payload inválido', async () => {
      const { user, headers } = await createAuthenticatedUser();
      const invoice = await createTestInvoice(user.id);

      const res = await requestApp()
        .patch(`/invoices/${invoice.id}`)
        .set(headers)
        .send({ amount: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('retorna 400 ao tentar atualizar invoice cancelada', async () => {
      const { user, headers } = await createAuthenticatedUser();
      const invoice = await createTestInvoice(user.id, { status: 'CANCELED' });

      const res = await requestApp()
        .patch(`/invoices/${invoice.id}`)
        .set(headers)
        .send({ amount: 200 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /invoices/:id', () => {
    it('deleta invoice com sucesso', async () => {
      const { user, headers } = await createAuthenticatedUser();
      const invoice = await createTestInvoice(user.id);

      const res = await requestApp()
        .delete(`/invoices/${invoice.id}`)
        .set(headers);

      expect(res.status).toBe(204);
    });

    it('retorna 404 quando invoice não existe', async () => {
      const { headers } = await createAuthenticatedUser();
      const idInexistente = randomUUID();

      const res = await requestApp()
        .delete(`/invoices/${idInexistente}`)
        .set(headers);

      expect(res.status).toBe(404);
    });

    it('retorna 400 para UUID inválido', async () => {
      const { headers } = await createAuthenticatedUser();

      const res = await requestApp()
        .delete('/invoices/abc')
        .set(headers);

      expect(res.status).toBe(400);
    });
  });
});
