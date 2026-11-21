/**
 * @swagger
 * /workshops:
 *   get:
 *     summary: Отримати всі майстерні
 *     description: Повертає список всіх майстерень
 *     tags: [Workshops]
 *     responses:
 *       200:
 *         description: Список майстерень
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 workshops:
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
 * /workshops/user:
 *   get:
 *     summary: Отримати майстерні користувача
 *     description: Повертає список майстерень конкретного користувача
 *     tags: [Workshops]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID користувача
 *     responses:
 *       200:
 *         description: Список майстерень користувача
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 workshops:
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
 * /workshops/add:
 *   post:
 *     summary: Додати нову майстерню
 *     description: Створює нову майстерню з можливістю завантаження зображень
 *     tags: [Workshops]
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
 *               - phoneNumber
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               place:
 *                 type: string
 *                 description: JSON string з placeId, title, address, coordinates
 *               motoTypesWorks:
 *                 type: string
 *                 description: JSON array з типами мотоциклів
 *               autoTypesWorks:
 *                 type: string
 *                 description: JSON array з типами автомобілів
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
 *         description: Майстерня успішно створена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 workshop:
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
 * /workshops/change:
 *   put:
 *     summary: Оновити майстерню
 *     description: Оновлює дані майстерні, включаючи зображення
 *     tags: [Workshops]
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
 *               phoneNumber:
 *                 type: string
 *               place:
 *                 type: string
 *                 description: JSON string з placeId, title, address, coordinates
 *               motoTypesWorks:
 *                 type: string
 *                 description: JSON array з типами мотоциклів
 *               autoTypesWorks:
 *                 type: string
 *                 description: JSON array з типами автомобілів
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
 *         description: Майстерня успішно оновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 workshop:
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
 * /workshops/delete:
 *   delete:
 *     summary: Видалити майстерню
 *     description: Видаляє майстерню та всі пов'язані зображення
 *     tags: [Workshops]
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
 *                 description: ID майстерні
 *     responses:
 *       200:
 *         description: Майстерня успішно видалена
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
 * /workshops/comments/add:
 *   post:
 *     summary: Додати коментар до майстерні
 *     description: Додає новий коментар та оновлює рейтинг майстерні
 *     tags: [Workshops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idWorkshop
 *               - userId
 *               - userName
 *               - description
 *               - rating
 *             properties:
 *               idWorkshop:
 *                 type: string
 *                 description: ID майстерні
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
 *                 workshop:
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
 * /workshops/comments/change:
 *   put:
 *     summary: Оновити коментар майстерні
 *     description: Оновлює існуючий коментар та перераховує рейтинг майстерні
 *     tags: [Workshops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idWorkshop
 *               - _id
 *             properties:
 *               idWorkshop:
 *                 type: string
 *                 description: ID майстерні
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
 *                 workshop:
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
