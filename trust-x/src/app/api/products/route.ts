/**
 * Products API Route - CRUD Operations
 * GET /api/products - Retrieve all products with pagination
 * POST /api/products - Create a new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET: Retrieve all products with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Number(searchParams.get('limit')) || 10);
    const search = searchParams.get('search') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = Number(minPrice);
      if (maxPrice) whereClause.price.lte = Number(maxPrice);
    }

    // Fetch products and total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          sku: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST: Create a new product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, stock, sku } = body;

    // Validate required fields
    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and stock are required' },
        { status: 400 }
      );
    }

    // Check if SKU is unique (if provided)
    if (sku) {
      const existingProduct = await prisma.product.findFirst({
        where: { sku },
      });
      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'SKU already exists' },
          { status: 409 }
        );
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: Number(price),
        stock: Number(stock),
        sku: sku || `SKU-${Date.now()}`,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        sku: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: product,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
