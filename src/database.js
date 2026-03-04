import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const connection = async () => {
    try {
        const dbURI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL;
        const { connection } = await mongoose.connect(dbURI);
        console.log(`✅ Base de datos conectada en ${connection.host} - puerto ${connection.port}`);
    } catch (error) {
        console.error("❌ Error conectando a MongoDB:", error.message);
        process.exit(1); 
    }
};

export default connection;