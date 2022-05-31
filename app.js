const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
mongoose.connect("mongodb+srv://admin-dev:test1234@cluster0.wak0l.mongodb.net/todolistdb");

const itemsSchema = mongoose.Schema ({
  name:String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item(
  {  name: "Do laundry"});
const item2 = new Item(
  {  name: "Do homework"});
const item3 = new Item(
  {  name: "Play games"});

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const defaultItem = [item1,item2,item3];

const List = mongoose.model("List", listSchema);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {

  Item.find({},function(err, foundItems){
    if(foundItems.length === 0) {
      Item.insertMany(defaultItem, function(err){
        if(err) {
          console.log(err);
        }
        else {
          console.log("Successfully added the default items to DB!");
        }
        res.redirect("/");
      })
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })

});

app.get("/:customListName", function(req,res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}, function(err, foundList){
    if(!err) {
      if(!foundList) {
        //Create a new list
        const list = new List ({
          name: customListName,
          items: defaultItem
        });

        list.save();
        res.redirect("/"+customListName);
      }
      else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    name: itemName
  });

  if(listName === 'Today') {
    newItem.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res) {
  const id = req.body.checkbox;
  const listName = req.body.listName;

    // FIRST METHOD TO REMOVE THE ITEM FROM TODOLIST
    // Item.deleteOne({_id:id}, function(err){
    //   if(err) console.log(err);
    //   else console.log("Successfully deleted the item.");
    // });

  if(listName === 'Today') {
    Item.findByIdAndRemove(id, function(err) {
      if(err) console.log(err);
      res.redirect("/");
    })
  }
  else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: id}}}, function(err) {
      if(err) console.log(err);
      else res.redirect("/" + listName);
    })
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function() {
  console.log("Server has started successfully!!!");
});
