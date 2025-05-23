import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReciverSocketId, io } from "../lib/socket.js";
import { encryptText } from "../lib/encryption.js";
import { decryptText } from "../lib/encryption.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};




export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    const decryptedMessages = messages.map((msg) => ({
      ...msg._doc,
      text: msg.text ? decryptText(msg.text) : null,
    }));

    res.status(200).json(decryptedMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const sendMessage = async(req, res) => {
  try {
    const {text, image} = req.body;
    const {id: receiverId} = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if(image){
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const encryptedText = text ? encryptText(text) : null;

    const newMessage = new Message({
      senderId,
      receiverId,
      text: encryptedText,
      image: imageUrl,
    });

    await newMessage.save();
    
    const receiverSocketId = getReciverSocketId(receiverId);
    if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage", {
        ...newMessage._doc,
        text: decryptText(newMessage.text),
      });
      
}


res.status(201).json({
  ...newMessage._doc,
  text: decryptText(newMessage.text),
});

  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({error: "Internal server error"});
  }
};