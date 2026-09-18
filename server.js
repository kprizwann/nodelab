const express = require("express");
const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");

const app = express();

const PORT = 3000;

const usersFile =
    path.join(__dirname, "users.json");

const auditFile =
    path.join(__dirname, "audit.log");


// =====================================
// MIDDLEWARE
// =====================================

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// =====================================
// EVENTS
// =====================================

const authEvents =
    new EventEmitter();


// Signup event
authEvents.on("signup", (user) => {

    const message =
        `[${new Date().toISOString()}] ` +
        `SIGNUP: ${user.email}\n`;

    fs.appendFileSync(
        auditFile,
        message
    );
});


// Login event
authEvents.on("login", (user) => {

    const message =
        `[${new Date().toISOString()}] ` +
        `LOGIN: ${user.email}\n`;

    fs.appendFileSync(
        auditFile,
        message
    );
});


// =====================================
// READ USERS
// =====================================

function readUsers() {

    const data =
        fs.readFileSync(
            usersFile,
            "utf-8"
        );

    return JSON.parse(data);
}


// =====================================
// SAVE USERS
// =====================================

function saveUsers(users) {

    fs.writeFileSync(
        usersFile,
        JSON.stringify(
            users,
            null,
            2
        ),
        "utf-8"
    );
}


// =====================================
// SIGN UP
// =====================================

app.post("/signup", (req, res) => {

    const {
        name,
        email,
        password
    } = req.body;


    if (!name || !email || !password) {

        return res.status(400).json({

            success: false,

            message:
                "Please fill in all fields."

        });
    }


    const users =
        readUsers();


    const existingUser =
        users.find(
            user =>
                user.email === email
        );


    if (existingUser) {

        return res.status(409).json({

            success: false,

            message:
                "Email already registered."

        });
    }


    const newUser = {

        name,
        email,
        password

    };


    users.push(newUser);


    saveUsers(users);


    authEvents.emit(
        "signup",
        newUser
    );


    res.json({

        success: true,

        message:
            "Registration successful!"

    });

});


// =====================================
// LOGIN
// =====================================

app.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;


    if (!email || !password) {

        return res.status(400).json({

            success: false,

            message:
                "Please enter email and password."

        });
    }


    const users =
        readUsers();


    const user =
        users.find(
            user =>
                user.email === email &&
                user.password === password
        );


    if (!user) {

        return res.status(401).json({

            success: false,

            message:
                "Invalid email or password."

        });
    }


    authEvents.emit(
        "login",
        user
    );


    res.json({

        success: true,

        message:
            "Login successful!",

        name:
            user.name

    });

});


// =====================================
// START SERVER
// =====================================

app.listen(
    PORT,
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);