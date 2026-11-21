/**
 * @swagger
 * /events:
 *   get:
 *     summary: Отримати всі події
 *     description: Повертає список всіх подій, відсортованих за датою початку
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Список подій
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                 code:
 *                   type: number
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/user:
 *   get:
 *     summary: Отримати події користувача
 *     description: Повертає список подій конкретного користувача, відсортованих за датою початку
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID користувача
 *     responses:
 *       200:
 *         description: Список подій користувача
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                 code:
 *                   type: number
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/add:
 *   post:
 *     summary: Додати нову подію
 *     description: Створює нову подію з можливістю завантаження зображень
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - description
 *               - date
 *               - currency
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               place:
 *                 type: string
 *                 description: JSON string з placeId, title, address, coordinates
 *               date:
 *                 type: string
 *                 description: JSON object з start та finish (timestamp)
 *               price:
 *                 type: string
 *                 description: JSON object з start та finish (опціонально)
 *               timeline:
 *                 type: string
 *                 description: JSON array з пунктами розкладу ({ start, finish?, title, description? })
 *               currency:
 *                 type: string
 *               contacts:
 *                 type: string
 *                 description: "JSON array з контактами. Формат: масив об'єктів з полями type (phone, email, viber, telegram, whatsapp, instagram, facebook) та value (string)"
 *               imageFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Подія успішно створена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 event:
 *                   type: object
 *                 code:
 *                   type: number
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/change:
 *   post:
 *     summary: Оновити подію
 *     description: Оновлює дані події, включаючи зображення
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *             properties:
 *               _id:
 *                 type: string
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               place:
 *                 type: string
 *                 description: JSON string з placeId, title, address, coordinates
 *               date:
 *                 type: string
 *                 description: JSON object з start та finish (timestamp)
 *               price:
 *                 type: string
 *                 description: JSON object з start та finish (опціонально)
 *               timeline:
 *                 type: string
 *                 description: JSON array з пунктами розкладу ({ _id, start, finish?, title, description? })
 *               currency:
 *                 type: string
 *               contacts:
 *                 type: string
 *                 description: "JSON array з контактами. Формат: масив об'єктів з полями type (phone, email, viber, telegram, whatsapp, instagram, facebook) та value (string)"
 *               existingImages:
 *                 type: string
 *                 description: JSON array з існуючими зображеннями
 *               imageFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Подія успішно оновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 event:
 *                   type: object
 *                 code:
 *                   type: number
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/delete:
 *   delete:
 *     summary: Видалити подію
 *     description: Видаляє подію та всі пов'язані зображення
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *             properties:
 *               _id:
 *                 type: string
 *                 description: ID події
 *     responses:
 *       200:
 *         description: Подія успішно видалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 code:
 *                   type: number
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/comments/add:
 *   post:
 *     summary: Додати коментар до події
 *     description: Додає новий коментар та оновлює рейтинг події
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idEvent
 *               - userId
 *               - userName
 *               - description
 *               - rating
 *             properties:
 *               idEvent:
 *                 type: string
 *                 description: ID події
 *               userId:
 *                 type: number
 *               userName:
 *                 type: string
 *               description:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               dateCreate:
 *                 type: number
 *               dateUpdate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Коментар успішно додано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 event:
 *                   type: object
 *                 code:
 *                   type: number
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /events/comments/change:
 *   put:
 *     summary: Оновити коментар події
 *     description: Оновлює існуючий коментар та перераховує рейтинг події
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idEvent
 *               - _id
 *             properties:
 *               idEvent:
 *                 type: string
 *                 description: ID події
 *               _id:
 *                 type: string
 *                 description: ID коментаря
 *               userId:
 *                 type: number
 *               userName:
 *                 type: string
 *               description:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               dateCreate:
 *                 type: number
 *               dateUpdate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Коментар успішно оновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 event:
 *                   type: object
 *                 code:
 *                   type: number
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
