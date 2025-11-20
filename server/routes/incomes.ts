import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/incomes - Get all incomes
router.get('/', async (req, res) => {
  try {
    const { customerId } = req.query;
    const where = customerId ? { customerId: customerId as string } : {};
    
    const incomes = await prisma.income.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: { incomeDate: 'desc' },
    });
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
});

// GET /api/incomes/:id - Get income by ID
router.get('/:id', async (req, res) => {
  try {
    const income = await prisma.income.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
      },
    });
    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// POST /api/incomes - Create income
router.post('/', async (req, res) => {
  try {
    const { customerId, customerName, incomeDate, invoiceNumber, vatRate, amountBeforeVat } = req.body;
    
    // Check for duplicate income (same customer, date, and invoice number if provided)
    // This prevents accidental double submissions
    if (invoiceNumber) {
      const existingIncome = await prisma.income.findFirst({
        where: {
          customerId,
          invoiceNumber,
          incomeDate: new Date(incomeDate),
        },
      });
      
      if (existingIncome) {
        return res.status(409).json({ 
          error: 'Duplicate income', 
          message: 'An income with the same invoice number, customer, and date already exists',
          existingIncome 
        });
      }
    }
    
    const vatAmount = amountBeforeVat * (vatRate || 0.18);
    const finalAmount = amountBeforeVat + vatAmount;
    
    const income = await prisma.income.create({
      data: {
        customerId,
        customerName,
        incomeDate: new Date(incomeDate),
        invoiceNumber,
        vatRate: vatRate || 0.18,
        amountBeforeVat,
        vatAmount,
        finalAmount,
      },
      include: {
        customer: true,
      },
    });
    res.status(201).json(income);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Duplicate income', 
        message: 'An income with these details already exists' 
      });
    }
    res.status(500).json({ error: 'Failed to create income', details: error.message });
  }
});

// PUT /api/incomes/:id - Update income
router.put('/:id', async (req, res) => {
  try {
    const { incomeDate, vatRate, amountBeforeVat, ...otherData } = req.body;
    const data: any = { ...otherData };
    
    if (incomeDate) {
      data.incomeDate = new Date(incomeDate);
    }
    
    if (vatRate !== undefined || amountBeforeVat !== undefined) {
      const currentIncome = await prisma.income.findUnique({
        where: { id: req.params.id },
      });
      
      const finalVatRate = vatRate !== undefined ? vatRate : currentIncome!.vatRate;
      const finalAmountBeforeVat = amountBeforeVat !== undefined ? amountBeforeVat : currentIncome!.amountBeforeVat;
      
      data.vatRate = finalVatRate;
      data.amountBeforeVat = finalAmountBeforeVat;
      data.vatAmount = finalAmountBeforeVat * finalVatRate;
      data.finalAmount = finalAmountBeforeVat + data.vatAmount;
    }
    
    const income = await prisma.income.update({
      where: { id: req.params.id },
      data,
      include: {
        customer: true,
      },
    });
    res.json(income);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Income not found' });
    }
    res.status(500).json({ error: 'Failed to update income' });
  }
});

// DELETE /api/incomes/:id - Delete income
router.delete('/:id', async (req, res) => {
  try {
    await prisma.income.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Income not found' });
    }
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

export { router as incomesRouter };

