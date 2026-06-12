import type { Request, Response } from "express";
import { FinancialService } from "../services/financial.service.js";
import * as Res from "../utils/response.js";

export const FinancialController = {
  async deposit(req: Request, res: Response) {
    const result = await FinancialService.deposit({
      userId: req.user!.sub,
      ...req.body,
    });
    return Res.success(res, result, result.message);
  },

  async withdraw(req: Request, res: Response) {
    const result = await FinancialService.withdraw({
      userId: req.user!.sub,
      ...req.body,
    });
    return Res.success(res, result, result.message);
  },

  async confirmWithdraw(req: Request, res: Response) {
    const { id } = req.params;
    const result = await FinancialService.confirmWithdraw(id);
    return Res.success(res, result, result.message);
  },

  async cancelWithdraw(req: Request, res: Response) {
    const { id } = req.params;
    const result = await FinancialService.cancelWithdraw(id, req.user!.sub);
    return Res.success(res, result, result.message);
  },

  async transactions(req: Request, res: Response) {
    const {
      page = "1",
      limit = "10",
      type,
    } = req.query as Record<string, string>;
    const result = await FinancialService.getTransactions(req.user!.sub, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      type,
    });
    return Res.paginated(res, result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  },

  async balance(req: Request, res: Response) {
    const data = await FinancialService.getBalance(req.user!.sub);
    return Res.success(res, data);
  },

  async cancelDeposit(req: Request, res: Response) {
    const { id } = req.params;
    const result = await FinancialService.cancelDeposit(id, req.user!.sub);
    return Res.success(res, result, result.message);
  },
};
