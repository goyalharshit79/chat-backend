/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
// const { setGlobalOptions } = require("firebase-functions");
// setGlobalOptions({ maxInstances: 10 });
const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
// const { createServer } = require("http");
// const { Server, Socket } = require("socket.io");

const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// const connectDb = async () => {
//   try {
//   } catch (error) {}
// };
// connectDb();
mongoose.connect(process.env.DB_ADRESS, {
  useNewUrlParser: true,
});

// const server = createServer(app);

//making schemas and stuff
const userSchema = {
  name: String,
  email: String,
  password: String,
  pic: String,
};
const User = mongoose.model("User", userSchema);

const messageSchema = new mongoose.Schema(
  {
    senderId: String,
    text: String,
    read: Boolean,
    reply: {},
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);

const deletedMessage = new mongoose.Schema({
  message: {},
});
const DeletedMessage = mongoose.model("DeletedMessage", deletedMessage);

// const io = new Server(server, { cors: { origin: "*" } });
//socket io stuff here
// io.on("connection", (socket) => {
//   console.log("connection created");

//   socket.on("sendMessage", (message) => {
//     io.emit("getMessage", message);
//   });
//   socket.on("deleteMessage", () => {
//     io.emit("deleteTheMessage");
//   });
//   socket.on("showTyping", (id) => {
//     io.emit("showTheTyping", id);
//   });
// });

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.find({ email: email });
    if (existingUser.length == 0) {
      const newUser = new User({
        name: name,
        email: email,
        password: password,
        pic: "",
      });
      newUser.save();
      res.status(200).json({
        msg: "You have been successfully signed up. Log in to continue.",
      });
    } else {
      res
        .status(200)
        .json({ msg: "There already exists a user with this name." });
    }
  } catch (error) {
    res.status(500).json({ msg: "There was an error while signing up" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const usersFound = await User.find({ email: email });
    if (usersFound.length) {
      if (usersFound[0].password === password) {
        res
          .status(200)
          .json({ msg: "successfully logged in !", user: usersFound[0] });
      } else {
        res
          .status(201)
          .json({ msg: "Please check the password and try again !" });
      }
    } else {
      res.status(201).json({
        msg: "No user with this name, please signin and then try loggin in !",
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "There was an error while loggin in" });
  }
});

app.post("/new-message", async (req, res) => {
  try {
    const { senderId, read, reply, text } = req.body;

    reply.reply = {};
    const newMessage = new Message({
      senderId: senderId,
      read: read,
      reply: reply,
      text: text,
    });
    newMessage.save();
    res.status(200).json();
  } catch (error) {
    res.status(500).json();
  }
});

app.get("/get-messages/:page", async (req, res) => {
  try {
    let toLoad = 20 * req.params.page;

    const totalMessages = await Message.find({});
    // console.log(totalMessages.length);
    if (toLoad > totalMessages.length) {
      toLoad = totalMessages.length;
    }

    let messages = await Message.find().sort({ createdAt: -1 }).limit(toLoad);
    messages = messages.reverse();
    for (let i = 0; i < messages.length; i++) {
      console.log(messages[i].text);
    }
    const toSend = {
      messages: messages,
      max: totalMessages.length,
    };
    res.status(200).json(toSend);

    // console.log(messages.slice());

    // const messages = Message.findOne().sort().limit(10).exec();
    // console.log(messages);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/get-messages", async (req, res) => {
  try {
    const toSend = await Message.find();
    res.status(200).json(toSend);

    // console.log(messages.slice());

    // const messages = Message.findOne().sort().limit(10).exec();
    // console.log(messages);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/get-userid/:email", async (req, res) => {
  try {
    const id = await User.find({ email: req.params.email });
    res.status(200).json({ id: id[0]._id });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/get-friend/:loggedIn", async (req, res) => {
  try {
    let friend = "";
    const users = await User.find();
    users.forEach((user) => {
      if (user._id != req.params.loggedIn) {
        friend = user;
      }
    });
    res.status(200).json({ friend: friend });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/get-user-details/:id", async (req, res) => {
  try {
    const user = await User.find({ _id: req.params.id });
    res.status(200).json(user[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/update-profile-pic", async (req, res) => {
  try {
    const user = await User.find({ _id: req.body.id });
    user[0].pic = req.body.pic;
    user[0].save();
    res.status(200).json({ user: user[0] });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/delete-message/:messageId", async (req, res) => {
  try {
    const messageFound = await Message.find({ _id: req.params.messageId });
    const newDeletedMessage = new DeletedMessage({
      message: messageFound[0],
    });
    newDeletedMessage.save();

    setTimeout(async () => {
      await Message.deleteOne({ _id: req.params.messageId });
    }, 2000);

    res.status(200).json();
  } catch (error) {
    res.status(500).json(error);
  }
});

exports.api = onRequest(app);

// app.listen(8000, () => {
//   console.log("The port is listening at the port " + 8000);
// });
