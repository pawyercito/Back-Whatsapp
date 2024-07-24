import cron from 'node-cron';
import Estado from '../../src/models/Estado.js';

// Configura el cron job para ejecutarse cada hora
cron.schedule('0 * * * *', async () => {
    const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás

    try {
        await Estado.deleteMany({ createdAt: { $lt: expirationTime } });
        console.log('Estados antiguos eliminados exitosamente.');
    } catch (error) {
        console.error('Error al eliminar estados antiguos:', error);
    }
});
