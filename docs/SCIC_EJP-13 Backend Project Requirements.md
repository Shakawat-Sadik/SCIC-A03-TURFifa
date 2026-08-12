**SCIC/EJP-13 Backend Project Requirements**

Prepare a backend with a **production-ready, scalable, and well-structured REST API** using **Express.js, TypeScript, Prisma ORM, and PostgreSQL**. This backend must be designed to seamlessly integrate with your frontend application.

## **1\. Project Setup**

**Required Stack**

* Express.js  
* TypeScript (Required)  
* PostgreSQL / Supabase / NeonDB / PrismaDB  
* Prisma ORM  
* JWT Authentication  
* bcrypt  
* dotenv  
* CORS

## **2\. Project Structure**

Maintain a clean and modular architecture.

server/  
│  
├── prisma/  
│   └── schema.prisma  
│  
├── src/  
│   ├── app.ts  
│   ├── server.ts  
│   │  
│   ├── routes/  
│   ├── services/  
│   │     ├── user/  
│   │     ├── category/  
│   │     ├── product/ (or project services)  
│   │     └── ...  
│   │  
│   └── lib/  
│  
├── .env  
├── package.json  
└── tsconfig.json

## **3\. Database Design**

Design a normalized relational database using Prisma.

The project must include:

* Minimum **4 services**  
* At least **2 Enums**  
* Proper relationships  
* Soft Delete support  
* Created & Updated timestamps  
* Table mapping using @@map()

Example models:

* User  
* Category  
* Product / Event / Service  
* Review  
* Order / Booking / Wishlist

Each model should contain:

* Primary Key  
* Validation-ready fields  
* Proper relations  
* Optional fields where necessary  
* Status field (Enum)  
* Soft delete (isDeleted)

## **4\. Authentication System**

Implement a complete authentication system.

Required features:

* User Registration  
* Login  
* Password Hashing (bcrypt)  
* JWT Authentication

## **5\. CRUD API Development**

Develop complete REST APIs for every major module.

Each module must support:

* Create  
* Get All  
* Get By ID  
* Update  
* Delete (Soft Delete)

Example APIs:

/api/auth

/api/users

/api/categories

/api/products

/api/reviews

API responses must follow a consistent structure.

**Example:**

{  
  "success": true,  
  "message": "Product retrieved successfully",  
  "data": {}  
}

## **6\. Prisma Features**

The project must demonstrate practical Prisma usage.

Required:

* Prisma Client  
* Prisma Migrate  
* Prisma Studio  
* Relations  
* Enum  
* Indexes

## **7\. Code Quality**

Follow clean coding practices.

Requirements:

* Modular Architecture  
* Meaningful Naming  
* No Duplicate Code  
* Type Safety

## **8\. API Documentation**

Provide clear API documentation.

Include:

* Endpoint  
* Method  
* Description  
* Request Body  
* Response  
* Status Codes

## **9\. Frontend Integration**

The backend **must be fully integrated with the frontend project**.

Requirements:

* Frontend consumes all backend APIs.  
* Authentication works end-to-end.  
* CRUD operations update the UI in real time.

## **17\. Final Submission Requirements**

* Live Backend API URL  
* GitHub Repository Link  
* API Documentation

