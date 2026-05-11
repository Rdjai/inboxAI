const queueService = require('../../queues');

class QueueController {
    async getQueueStatus(req, res, next) {
        try {
            const stats = await queueService.getQueueStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new QueueController();