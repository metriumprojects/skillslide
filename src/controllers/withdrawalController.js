import User from "../models/User.js";
import Withdrawal from "../models/Withdrawal.js";
import { generateOrderNo } from "../utils/utils.js";

export const createWithdrawal = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, accountNo, bank, amount, country, currency, iban, routingNumber, swiftBic } = req.body;

        if (!name || !accountNo || !bank || !amount) {
            return res.status(400).json({ message: "All fields required" });
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: "Withdrawal amount must be a positive number" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const reqCurrency = (currency || user.currency || "USD").toUpperCase();
        const availableInMap = user.balances?.available instanceof Map 
            ? user.balances.available.get(reqCurrency) 
            : user.balances?.available?.[reqCurrency];
        const userAvailable = (typeof availableInMap === "number" && !isNaN(availableInMap))
            ? availableInMap
            : (reqCurrency === "USD" ? (user.money || 0) : 0);

        if (userAvailable < numericAmount) {
            return res.status(400).json({ 
                message: `Insufficient balance. Available: ${userAvailable} ${reqCurrency}, requested: ${numericAmount} ${reqCurrency}` 
            });
        }

        const withdrawal = await Withdrawal.create({
            userId,
            name,
            accountNo,
            bank,
            amount: numericAmount,
            country,
            currency: reqCurrency,
            iban,
            routingNumber,
            swiftBic,
            orderNo: generateOrderNo(),
            status: "pending",
        });

        const updateOps = {
            $inc: {
                [`balances.available.${reqCurrency}`]: -numericAmount
            }
        };
        if (reqCurrency === "USD") {
            updateOps.$inc.money = -numericAmount;
        }
        await User.findByIdAndUpdate(userId, updateOps);

        res.json({ status: true, message: "Withdrawal request created", withdrawal });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserWithdrawals = async (req, res) => {
    try {
        const userId = req.user._id;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalItems = await Withdrawal.countDocuments({ userId });

        const withdrawals = await Withdrawal.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.json({
            status: true,
            withdrawals,
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const approveWithdrawal = async (req, res) => {
    try {
        const { id } = req.params; // withdrawalId
        const { status } = req.body;

        const withdrawal = await Withdrawal.findById(id);
        if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });

        if (withdrawal.status !== "pending")
            return res.status(400).json({ message: "Already processed" });

        if (status === "approved") {
            withdrawal.status = "approved";
            await withdrawal.save();
        } else {

            // OPTIONAL → Update User Balance
            const rejectCurrency = (withdrawal.currency || "USD").toUpperCase();
            const rejectOps = {
                $inc: {
                    [`balances.available.${rejectCurrency}`]: withdrawal.amount,
                    money: withdrawal.amount,
                }
            };
            await User.findByIdAndUpdate(withdrawal.userId, rejectOps);
            withdrawal.status = "rejected";
            await withdrawal.save();
        }



        res.json({ status: true, message: "Withdrawal status updated", withdrawal });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getAllWithdrawals = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status) filter.status = req.query.status; // optional filter (pending/approved/rejected)

        const totalItems = await Withdrawal.countDocuments(filter);

        const withdrawals = await Withdrawal.find(filter)
            .populate("userId", "name email phone")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.json({
            status: true,
            withdrawals,
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


