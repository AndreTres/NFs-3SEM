import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
