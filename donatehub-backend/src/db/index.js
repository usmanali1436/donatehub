import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        let connectionString;
        
        if (mongoURI.includes('mongodb://') || mongoURI.includes('mongodb+srv://')) {
            connectionString = mongoURI.endsWith('/') 
                ? `${mongoURI}${DB_NAME}` 
                : `${mongoURI}/${DB_NAME}`;
        } else {
            connectionString = `${mongoURI}/${DB_NAME}`;
        }
        
        const connectionInstance = await mongoose.connect(connectionString);
        console.log("Mongodb Connected || HOST: ", connectionInstance.connection.host);
        console.log("Database Name: ", connectionInstance.connection.name);
    } catch (error) {
        console.error("Database Connection failed: ", error);
        process.exit(1);
    }
};

export default connectDB;
