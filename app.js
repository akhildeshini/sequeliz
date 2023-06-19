const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const brcypt = require("bcrypt");
const { promisify } = require("util");
const dotenv = require("dotenv");
const { User, sequelize, Post, Reactions } = require("./models");

const app = express();
app.use(express.json());
app.use(cookieParser());
dotenv.config({ path: "./env" });

const signToken = (uuid) => {
  return jwt.sign(
    { id: uuid },
    "akhil-is-so-fucked-up-he-makes-lot-of-mistakes",
    {
      expiresIn: "30s",
    }
  );
};

app.post("/signup", async (req, res) => {
  try {
    const { name, email, role, hash } = req.body;
    console.log(name, email, role, hash);
    const password = await brcypt.hash(hash, 10);
    const users = await User.create({ name, email, role, password });
    if (!users) {
      console.log(users);
      return res.status(400).json("something went wrong");
    }
    const token = signToken(users.uuid);
    if (!token) {
      return res.json({ msg: "something went wrong please signup again" });
    }
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   sameSite: "lax",
    //   maxAge: 24 * 60 * 60 * 1000,
    // });
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(400).json(err);
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(403).json({ msg: "email or password are incorrect" });
    }
    console.log("password", password, "user password", user.password);
    const result = await brcypt.compare(password, user.password);
    if (!result) {
      return res.status(401).json({ msh: "passwords dont match" });
    }
    const token = signToken(user.uuid);
    const decodedToken = jwtDecode(token);

    console.log("decoded token", decodedToken);
    const userId = decodedToken.id;
    const userDetails = await User.findOne({ where: { uuid: userId } });
    console.log("user Details", userDetails.dataValues);
    const uservalues = userDetails.dataValues;
    uservalues.password = "";
    req.user = uservalues;
    const userstring = JSON.stringify(uservalues);
    console.log("stringfy", userstring);
    // res.cookie("userInfo", userstring, {
    //   maxAge: 24 * 60 * 60 * 1000,
    //   sameSite: "lax",
    // });
    const expiresAt = decodedToken.exp;
    const startsAt = decodedToken.iat;
    const datenode = new Date(expiresAt);
    const dateiat = new Date(startsAt);
    const diff = datenode - dateiat;
    console.log("datenode", datenode, dateiat, diff);
    // res.cookie("token", token, {
    //   maxAge: 24 * 60 * 60 * 1000,
    //   httpOnly: true,
    //   sameSite: "lax",
    // });
    // res.cookie("expires", expiresAt, {
    //   maxAge: 24 * 60 * 60 * 1000,
    //   sameSite: "lax",
    // });
    return res.json({
      token: token,
      expires: expiresAt,
      iat: startsAt,
      userInfo: userstring,
    });
  } catch (err) {
    return res.status(400).json(err);
  }
});
app.patch("/users", async (req, res) => {
  try {
    const { email, role } = req.body;
    console.log("email ,role", email, role);
    const user = await User.findOne({ where: { email } });
    user.set({
      role,
    });
    const user2 = await User.findOne({ where: { id: 2 } });
    console.log("user2", user2);
    await user.save();
    return res.json({ user1: user, user2: user2 });
  } catch (err) {
    return res.json(err);
  }
});
const restrict = async (req, res, next) => {
  // console.log("req from restrict", req.headers);
  console.log("token from restrict before breaking", req.headers.authorization);
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return res.json("not authorised pleaes login again");
  }

  const token = req.headers.authorization.split(" ")[1];
  console.log("token from restrict", token);
  jwt.verify(
    token,
    "akhil-is-so-fucked-up-he-makes-lot-of-mistakes",
    function (err, decode) {
      if (err) {
        return res.json("token not valid please login again");
      }
      if (decode) {
        next();
      }
    }
  );
  // console.log("verify", verif);
  // if (!verif) {
  //   return res.json("token malformed please login again");
};
app.get("/protect", restrict, async (req, res) => {
  return res.json({ msg: "hey this is a secret" });
});
app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({});
    return res.json(users);
  } catch (err) {
    return res.json(err);
  }
});
app.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("id", id);
    const users = await User.findOne({
      where: { id: id },
      // prettier-ignore
      include: "posts",
    });
    console.log("users", users);
    return res.json(users);
  } catch (err) {
    return res.json(err);
  }
});
app.post("/posts", async (req, res) => {
  try {
    const { uuid, post, category, description } = req.body;
    const user = await User.findOne({
      where: { uuid: uuid },
    });
    const id = user.id;
    console.log("id", id, uuid, post, category, description);
    const posts = await Post.create({
      title: post,
      userId: id,
      category,
      description,
    });
    return res.json(posts);
  } catch (err) {
    return res.json(err);
  }
});
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.findAll({});
    return res.json(posts);
  } catch (err) {
    return res.json(err);
  }
});
app.get("/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("id", id);
    const posts = await Post.findOne({ where: { id: id } });
    return res.json(posts);
  } catch (err) {
    return res.json(err);
  }
});
app.delete("/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("id", id);
    const token = req.cookies.token;
    if (!token) {
      return res.json({
        msg: "please login again to get required permissions",
      });
    }

    const post = await Post.findOne({ where: { id } });
    await post.destroy();
    return res.json(post);
  } catch (err) {
    return res.json(err);
  }
});
app.get("/category/:val", async (req, res) => {
  try {
    const val = req.params.val;
    const userdata = await Post.findAll({ where: { category: val } });
    if (!userdata) {
      return res.json({ msg: "no data found for specified category" });
    }
    return res.json(userdata);
  } catch (err) {
    return res.json(err);
  }
});
app.put("/posts/:id", async (req, res) => {
  try {
    const { uuid, post, category, description } = req.body;
    const posts = await Post.findOne({ where: { id } });
    posts.title = post;
    posts.category = category;
    posts.description = description;
    await posts.save();
    return res.json(posts);
  } catch (err) {
    return res.json(err);
  }
});
app.post("/react", async (req, res) => {
  try {
    const { postId } = req.body;
    const post = await Post.findOne({ where: { id: postId } });
    if (!post) {
      return res.json("not a valid post");
    }
    const reactions = await Reactions.findOne({ where: { postId: postId } });
    if (reactions) {
      return res.json("post already exists");
    }
    const val = await Reactions.create({ postId });
    return res.json(val);
  } catch (err) {
    return res.json(err);
  }
});
app.patch("/react", async (req, res) => {
  try {
    const { postId, userId, react } = req.body;
    const reactInfo = { id: userId, react: react };

    let reactions = await Reactions.findOne({ where: { postId: postId } });

    if (!reactions) {
      return res.json("Post doesn't exist to update");
    }

    if (reactions.reactions == null) {
      reactions.reactions = [reactInfo];
      reactions.number_of_likes = 1;
      await reactions.save();
      return res.json(reactions);
    }

    const findReact = reactions.reactions.findIndex(
      (val) => val.id === reactInfo.id
    );

    if (findReact >= 0) {
      return res.json("Already liked");
    }
    const reactarr = reactions;
    reactarr.reactions.push(reactInfo);
    reactions = reactarr;
    await reactions.save();

    return res.json(reactions);
  } catch (err) {
    console.error("Error updating reactions:", err);
    return res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/react", async (req, res) => {
  try {
    const reactions = await Reactions.findAll({});
    if (!reactions) {
      return res.json("No data");
    }
    return res.json(reactions);
  } catch (err) {
    return res.json(err);
  }
});
app.listen(5000, async () => {
  console.log("server is running at port 5000");
  await sequelize.authenticate();
});
