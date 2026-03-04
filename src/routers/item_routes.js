import { Router } from 'express';
import { 
    getDesktop, 
    createItem, 
    uploadFileItem, 
    getItemById, 
    renameItem, 
    moveItem, 
    updateBulkPositions, 
    updateTextContent, 
    deleteItem, 
    shareItem 
} from '../controllers/item_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

// Rutas de Obtención
router.get("/desktop", getDesktop);
router.get('/items/:id', getItemById);

// Rutas de Creación
router.post("/items", createItem);
router.post("/items/upload", uploadFileItem);

// Rutas de Modificación de Items
router.patch('/items/:id/renombrar', renameItem);
router.patch('/items/:id/mover', moveItem);
router.patch('/items/positions/bulk', updateBulkPositions);
router.put('/files/:id', updateTextContent); // Antes actulizarContenidoTextual

// Rutas de Eliminación y Compartir
router.delete('/items/:id', deleteItem);
router.post("/share/:id", shareItem);

export default router;