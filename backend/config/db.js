const mongoose=require("mongoose");
const migrateEmployeeDepartments = require("../utils/migrateEmployeeDepartments");
const migrateEmployeeDesignations = require("../utils/migrateEmployeeDesignations");

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");
        await migrateEmployeeDepartments();
        await migrateEmployeeDesignations();
    }catch(error){
        console.log(error);
    }
}
module.exports=connectDB;