import { Request, Response, NextFunction } from 'express';

export function login(req: Request, res: Response): Promise<void>;
export function signup(req: Request, res: Response): Promise<void>;
export function protectedRoute(req: Request, res: Response): void;
export function verifyToken(req: Request, res: Response, next: NextFunction): void;
export function uploadImage(req: Request, res: Response): void;
export function saveContent(req: Request, res: Response): void;
