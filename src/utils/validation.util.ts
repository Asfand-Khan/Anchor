import { body, query, ValidationChain } from "express-validator";
import { Gender } from "../types";

export class ValidationUtil {
  static register(): ValidationChain[] {
    return [
      body("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
      body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain uppercase, lowercase, and number"),
      body("full_name")
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Full name must be between 2 and 50 characters"),
      body("date_of_birth")
        .isISO8601()
        .withMessage("Invalid date format")
        .custom((value) => {
          const age = new Date().getFullYear() - new Date(value).getFullYear();
          if (age < 18) throw new Error("Must be at least 18 years old");
          if (age > 100) throw new Error("Invalid date of birth");
          return true;
        }),
      body("gender")
        .isIn(Object.values(Gender))
        .withMessage("Invalid gender value"),
    ];
  }

  static login(): ValidationChain[] {
    return [
      body("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
      body("password").notEmpty().withMessage("Password is required"),
    ];
  }

  static updateProfile(): ValidationChain[] {
    return [
      body("full_name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage("Full name must be between 2 and 255 characters"),
      body("bio")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Bio must not exceed 1000 characters"),
      body("location")
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage("Location must not exceed 255 characters"),
    ];
  }

  static sendMessage(): ValidationChain[] {
    return [
      body("content")
        .trim()
        .notEmpty()
        .withMessage("Message content is required")
        .isLength({ max: 5000 })
        .withMessage("Message must not exceed 5000 characters"),
    ];
  }

  static pagination(): ValidationChain[] {
    return [
      query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
      query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    ];
  }

  static userListQuery(): ValidationChain[] {
    return [
      ...this.pagination(),
      query("gender")
        .optional()
        .isIn(Object.values(Gender))
        .withMessage("Invalid gender value"),
      query("search")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Search query too long"),
    ];
  }

  static forgotPassword(): ValidationChain[] {
    return [
      body("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
    ];
  }

  static resetPassword(): ValidationChain[] {
    return [
      body("token").notEmpty().withMessage("Reset token is required"),
      body("new_password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain uppercase, lowercase, and number"),
    ];
  }
}
