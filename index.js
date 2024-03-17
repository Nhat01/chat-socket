var express = require("express");
var app = express();
const userRoute = require("./routes/userRoute");
const conversationRoute = require("./routes/conversationRoute");
const messageRoute = require("./routes/messageRoute");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const { isLogin } = require("./middleware/auth");
const User = require("./models/User");
const Conversation = require("./models/Conversation");

const server = require("http").createServer(app);
const io = require("socket.io")(server);

dotenv.config();

app.use(
   session({
      secret: process.env.SECRET_SESSION,
      resave: true,
      saveUninitialized: true,
   })
);

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const connectDB = async () => {
   try {
      const conn = await mongoose.connect(process.env.MONGO_URL);
      console.log("CONNECTED TO DATABASE SUCCESSFULLY");
   } catch (error) {
      console.error("COULD NOT CONNECT TO DATABASE:", error.message);
   }
};

connectDB();

app.get("/", isLogin, async function (req, res) {
   try {
      const users = await User.find({ _id: { $nin: [req.session.user._id] } });
      const conversations = await Conversation.find({
         members: { $in: [req.session.user._id] },
      })
         .populate("members", "profilePicture isOnline username")
         .populate({
            path: "lastMessage.senderId",
            select: "username",
         })
         .sort({
            createdAt: "desc",
            "lastMessage.createdAt": "desc",
         });

      res.render("pages/index", {
         user: req.session.user,
         users: users,
         conversations: conversations,
         messages: undefined,
      });
   } catch (error) {
      console.log(error);
   }
});

const unp = io.of("/user-namespace");

unp.on("connection", async (socket) => {
   console.log("a user connected");

   const userId = socket.handshake.auth.token;
   await User.findByIdAndUpdate({ _id: userId }, { $set: { isOnline: "1" } });

   socket.broadcast.emit("getOnlineUser", { user_id: userId });

   socket.emit("createRoom");

   socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(
         { _id: userId },
         { $set: { isOnline: "0" } }
      );
      socket.broadcast.emit("getOfflineUser", { user_id: userId });
      console.log("user disconnected");
   });

   socket.on("newChat", async (data) => {
      socket.broadcast.emit("loadNewChat", data);
   });

   socket.on("joinRoom", async (data) => {
      console.log("join ", data);
      socket.join(data);
   });

   socket.on("newConversation", (data) => {
      socket.broadcast.emit("loadNewConversation", data);
   });

   socket.on("recallMessage", (data) => {
      console.log(data);
      socket.broadcast.emit("loadDeleteMessage", data);
   });

   socket.on("deleteConversation", (data) => {
      console.log(data);
      socket.broadcast.emit("loadDeleteConversation", data);
   });
});

app.use("/", userRoute);
app.use("/conversation", isLogin, conversationRoute);
app.use("/message", isLogin, messageRoute);

const PORT = process.env.PORT || 8080;

server.listen(PORT);
console.log(`Server is listening on port ${PORT}`);
