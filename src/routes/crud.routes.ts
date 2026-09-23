import { Router, type RequestHandler } from 'express';

/**
 * Qualquer controller que tenha estes 5 métodos pode usar a função abaixo.
 * É uma INTERFACE usada para evitar repetir as mesmas 5 linhas de rota
 * em clientes, serviços, contratações, sites, manutenções e contatos.
 */
export interface CrudController {
  index: RequestHandler;
  show: RequestHandler;
  store: RequestHandler;
  update: RequestHandler;
  destroy: RequestHandler;
}

export function crudRoutes(controller: CrudController): Router {
  const router = Router();
  router.get('/', controller.index);
  router.post('/', controller.store);
  router.get('/:id', controller.show);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.destroy);
  return router;
}
