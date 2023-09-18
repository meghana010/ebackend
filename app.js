const express = require("express");
const cors = require("cors");
const session = require("express-session"); 
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));                    // mongodb://0.0.0.0:27017/react
app.use(cors());

const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://20311A0504:meghana1234@cluster0.qhzkco7.mongodb.net/react", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("MongoDB connected");
}).catch(() => {
  console.error("MongoDB connection failed");
});



app.use(session({
  secret: "your-secret-key", 
  resave: false,
  saveUninitialized: false,
 
}));


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, 
  },
  password: {
    type: String,
    required: true,
  },
});

// Create models for user and purchase history
const User = mongoose.model("User", userSchema);
const productSchema = new mongoose.Schema({
  email:String,
  id: Number,
  name: String,
  category: String,
  gender: String,
  price: Number,
  cover: String, 
  quantity: Number,
});
app.get("/", cors(), (req, res) => {
  
});
function generateCollectionName(email) {
  return `${email.replace("@", "_").replace(".", "_")}`;
}
app.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    const check = await User.findOne({ email: email, password: password });
    if (check) {
      
      //req.session.user = check;
      req.session.user = {
        email: email
      };
      
      app.post(`/purchase-history`, (req, res) => {
        const purchaseItems = req.body;
        const PurchaseHistory = mongoose.model(`PurchaseHistory`, productSchema, `PurchaseHistory`);
        const options = { ordered: false }; // Set ordered to false to avoid errors for existing documents
      
        PurchaseHistory.insertMany(purchaseItems, options, (err, result) => {
          if (err) {
            if (err.code === 11000) {
              // Error code 11000 indicates a duplicate key error, which can happen for existing documents
              console.error("Duplicate key error. Existing documents skipped.");
              res.status(200).json({ message: "Purchase history saved successfully" });
            } else {
              console.error("Error saving purchase history:", err);
              res.status(500).json({ error: "Failed to save purchase history" });
            }
          } else {
            console.log("Purchase history saved successfully:", result);
            res.status(200).json({ message: "Purchase history saved successfully" });
          }
        });
      });
      
 
 
  app.get(`/purchase-history`, (req, res) => {
    const loggedInEmail = req.query.email;
    const PurchaseHistory = mongoose.model(`PurchaseHistory`, productSchema,`PurchaseHistory`);
    PurchaseHistory.find({email: loggedInEmail }, (err, purchaseHistory) => {
      if (err) {
        console.error("Error fetching purchase history:", err);
        res.status(500).json({ error: "Failed to fetch purchase history" });
      } else {
        res.status(200).json(purchaseHistory);
      }
    });
  });
 
  app.post(`/add-to-cart`, (req, res) => {
    //const userEmail = req.session.user.email;
    const { item,email } = req.body;
     const Cart = mongoose.model(`Cart`, productSchema,`Cart`);
     const cartItem = new Cart({ ...item, email: email });
     cartItem.save((err) => {
      if (err) {
        console.error("Error adding item to cart:", err);
        res.status(500).json({ error: "Failed to add item to cart" });
      } else {
        res.status(200).json({ success: true });
      }
    });
  });
  app.get(`/cart`, (req, res) => {
    //const userEmail = req.session.user.email;
    const loggedInEmail = req.query.email;
    const Cart = mongoose.model(`Cart`, productSchema,`Cart`);
   Cart.find({email: loggedInEmail }, (err, cartItems) => {
      if (err) {
        console.error("Error fetching cart items:", err);
        res.status(500).json({ error: "Failed to fetch cart items" });
      } else {
        res.status(200).json(cartItems);
      }
    });
  });
  
  app.post(`/remove-from-cart`, (req, res) => {
    //const userEmail = req.session.user.email;
    const { productId,email } = req.body;
   const Cart = mongoose.model(`Cart`, productSchema,`Cart`);
     Cart.deleteOne({ id: productId,email:email }, (err) => {
      if (err) {
        console.error("Error removing item from cart:", err);
        res.status(500).json({ error: "Failed to remove item from cart" });
      } else {
        res.status(200).json({ success: true });
      }
    });
  });
  
  app.post('/update-cart-quantity', async (req, res) => {
    try {
      const { productId, quantity,email } = req.body;
      const Cart = mongoose.model(`Cart`, productSchema,`Cart`);
      const updatedCartItem = await Cart.findOneAndUpdate(
        { id: productId ,email:email}, 
        { $set: { quantity } }, 
        { new: true } 
      );
  
      if (!updatedCartItem) {
        return res.status(404).json({ success: false, message: 'Cart item not found' });
      }
  
      return res.status(200).json({ success: true, updatedCartItem });
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      return res.status(500).json({ success: false, message: 'Error updating cart item quantity', error: error.message });
    }
  });
  
  
  app.post(`/update-cart-item`, (req, res) => {
    //const userEmail = req.session.user.email;
    const { item ,email} = req.body; 
    const Cart = mongoose.model(`Cart`, productSchema,`Cart`);
     Cart.findOneAndUpdate(
      { id: item.id ,email:email}, 
      { $set: item }, 
      { new: true },
      (err, updatedCartItem) => {
        if (err) {
          console.error("Error updating item quantity in cart:", err);
          res.status(500).json({ error: "Failed to update item quantity in cart" });
        } else {
          res.status(200).json({ success: true });
        }
      }
    );
  });


  app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout Error:", err);
        res.status(500).json("Logout failed");
      } else {
        res.json("Logout success");
      }
    });
  });
  res.json("exist");

}else {

  res.json("notexist");

 }

} catch (e) {

 res.json("fail");

}

});


app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const userData = {
    email: email,
    password: password,
  };
  try {
    const check = await User.findOne({ email: email });
    if (check) {
      res.json("exist");
    } else {
      const newUser = new User(userData);
      await newUser.save();
      res.json("notexist");
    }
  } catch (e) {
    res.json("fail");
  }
});



const PORT=process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server is running on port ${PORT}");
});
