const { User } = require("../models");
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (_, args, context) => {
      if (context.user) {
        const foundUser = await User.findOne({ _id: context.user._id });
        if (!foundUser) {
          throw new Error("Cannot find a user with this id!");
        }
        return foundUser;
      } else {
        throw new Error("You are not authenticated.");
      }
    },
  },
  Mutation: {
    addUser: async (_, { username, email, password }, res) => {
      const user = await User.create({ username, email, password });

      if (!user) {
        throw new Error("Something went wrong!");      
      }
      const token = signToken(user);
      return { token, user };
    },

    login: async(_, { email, password }, res) {
      const user = await User.findOne({
        $or: [{ username: email }, { email }],
      });

      if (!user || !(await user.isCorrectPassword(password))) {
        throw new Error("Invalid credentials");
      }

      const token = signToken(user);
      return { token, user };
    },

   saveBook: async(_, { bookInput }, context) => {
    if (!context.user) {
      throw new Error("You are not authenticated.");
    }

    try {
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $addToSet: { savedBooks: bookInput } },
        { new: true, runValidators: true }
      );
      return updatedUser;
    } catch (err) {
      console.error(err);
      throw new Error("Could not save the book.");
    }
   },

   deleteBook: async (_, { bookId }, context) => {
    if (!context.user) {
      throw new Error("You are not authenticated.");
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: context.user._id },
      { $pull: { savedBooks: { bookId } } },
      { new: true }
    );
    if (!updatedUser) {
      throw new Error("User not found.");
    }
    return updatedUser;
  },
  },
};
