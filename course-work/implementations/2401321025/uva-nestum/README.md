\# Uva Nestum Wine \& SPA Hotel — Курсова работа



Уеб приложение за управление на хотел \*\*Uva Nestum Wine \& SPA\*\*



\---



\## Описание



Приложението представлява система за резервации и управление на хотел. Потребителите могат да разглеждат налични стаи и да правят резервации, а администраторите разполагат с табло за управление на стаи, резервации и потребители.



\---



\## Технологии



\### Backend

\- \*\*Node.js\*\* + \*\*Express.js\*\* — REST API сървър

\- \*\*better-sqlite3\*\* — локална SQLite база данни

\- \*\*JWT (jsonwebtoken)\*\* — автентикация с токени

\- \*\*bcryptjs\*\* — хеширане на пароли

\- \*\*CORS\*\* — поддръжка на cross-origin заявки



\### Frontend

\- \*\*HTML5 / CSS3 / JavaScript\*\* — без допълнителни фреймуъркове

\- Многостранично приложение с отделни страници



\---



\## Структура на проекта



```

uva-nestum/

├── backend/

│   ├── server.js          # Стартиране на сървъра (порт 3000)

│   ├── database.js        # Инициализация на SQLite базата

│   ├── middleware/

│   │   ├── auth.js        # JWT middleware

│   │   └── errorHandler.js

│   └── routes/

│       ├── auth.js        # Регистрация и вход

│       ├── rooms.js       # Управление на стаи

│       └── reservations.js # Управление на резервации

└── frontend/

&#x20;   ├── index.html         # Начална страница

&#x20;   ├── rooms.html         # Преглед на стаи

&#x20;   ├── login.html         # Вход / Регистрация

&#x20;   ├── admin-dashboard.html # Администраторско табло

&#x20;   ├── about.html

&#x20;   ├── contact.html

&#x20;   ├── gallery.html

&#x20;   ├── blog.html

&#x20;   └── style.css

```



\---



\## База данни



SQLite база с три таблици:



\- \*\*users\*\* — потребители с роли (`guest` / `admin`)

\- \*\*rooms\*\* — хотелски стаи с тип, цена и капацитет

\- \*\*reservations\*\* — резервации с check-in/check-out дати и статус



\---



\## Как се стартира



\### 1. Инсталирай зависимостите



```bash

cd backend

npm install

```



\### 2. Стартирай сървъра



```bash

npm start

```



Сървърът ще работи на: `http://localhost:3000`



\### 3. Отвори frontend-а



Отвори `frontend/index.html` директно в браузър или използвай Live Server от VS Code.



\---



\## API Endpoints



| Метод | Път | Описание |

|-------|-----|----------|

| POST | `/api/auth/register` | Регистрация |

| POST | `/api/auth/login` | Вход |

| GET | `/api/rooms` | Всички стаи |

| POST | `/api/rooms` | Добави стая (admin) |

| PUT | `/api/rooms/:id` | Редактирай стая (admin) |

| DELETE | `/api/rooms/:id` | Изтрий стая (admin) |

| GET | `/api/reservations` | Всички резервации |

| POST | `/api/reservations` | Направи резервация |

| PUT | `/api/reservations/:id` | Обнови резервация |

| DELETE | `/api/reservations/:id` | Изтрий резервация |



\---



\## Изготвил



Емил Александров, фак. номер: \*\*2401321025\*\*  

Пловдивски университет "Паисий Хилендарски"  

Специалност: Софтуерно инженерство 

