import { DataSource } from "typeorm";
import { config } from "./environment";
import { User } from "../entities/User.entity";
import { Follow } from "../entities/Follow.entity";
import { Message } from "../entities/Message.entity";
import { RefreshToken } from "../entities/RefreshToken.entity";
import { Like } from "../entities/Like.entity";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: config.server.nodeEnv === "development",
  logging: config.server.nodeEnv === "development",
  entities: [User, Follow, Message, RefreshToken, Like],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: [],
  charset: "utf8mb4",
  timezone: "Z",
  extra: {
    connectionLimit: 10,
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection established successfully");
  } catch (error) {
    console.error("❌ Error connecting to database:", error);
    process.exit(1);
  }
};

export default AppDataSource;
