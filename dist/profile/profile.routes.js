"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("./profile.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = __importDefault(require("../middlewares/upload.middleware")); // multer
const router = (0, express_1.Router)();
// Aquí indicamos que en provider aceptamos array máximo 15 fotos con nombre 'roomPhotos'
router.post('/roommate', auth_middleware_1.verifyToken, profile_controller_1.createRoommateProfile);
router.post('/provider', auth_middleware_1.verifyToken, upload_middleware_1.default.array('roomPhotos', 15), profile_controller_1.createRoomProviderProfile);
router.put('/roommate', auth_middleware_1.verifyToken, profile_controller_1.updateRoommateProfile);
router.delete('/roommate', auth_middleware_1.verifyToken, profile_controller_1.deleteRoommateProfile);
router.put('/provider', auth_middleware_1.verifyToken, upload_middleware_1.default.array('roomPhotos', 15), profile_controller_1.updateRoomProviderProfile);
router.delete('/provider', auth_middleware_1.verifyToken, profile_controller_1.deleteRoomProviderProfile);
router.get('/roommates/:id', profile_controller_1.getRoommateProfileById);
router.get('/providers/:id', profile_controller_1.getRoomProviderProfileById);
router.put('/me', auth_middleware_1.verifyToken, profile_controller_1.updateMyAccount);
router.delete('/me', auth_middleware_1.verifyToken, profile_controller_1.deleteMyAccount);
exports.default = router;
