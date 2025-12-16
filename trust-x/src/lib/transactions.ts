import { prisma } from './prisma';

/**
 * TRANSACTION EXAMPLE 1: Order Processing Transaction
 * Demonstrates atomic operations: create order, update inventory, create payment
 * If any operation fails, all changes are rolled back
 */
export async function processOrderTransaction(userId: number, productId: number, quantity: number) {
  try {
    console.log('🚀 Starting order processing transaction...');
    const startTime = Date.now();

    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Verify product exists and has enough stock
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, stock: true, price: true },
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      if (product.stock < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
        );
      }

      // Step 2: Create the order
      const order = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          totalAmount: product.price * quantity,
          status: 'pending',
        },
      });

      // Step 3: Create order item
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId,
          quantity,
          price: product.price,
        },
      });

      // Step 4: Update product inventory
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity },
        },
      });

      // Step 5: Create payment record (simulated)
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          userId,
          amount: order.totalAmount,
          status: 'pending',
          method: 'credit_card',
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      });

      return {
        order,
        orderItem,
        updatedProduct,
        payment,
      };
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Transaction completed successfully in ${duration}ms`);
    console.log('Transaction Result:', JSON.stringify(result, null, 2));

    return {
      success: true,
      duration,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Transaction failed. Rolling back all changes:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * TRANSACTION EXAMPLE 2: Batch User & Project Creation
 * Demonstrates multiple related object creation in a single transaction
 */
export async function createUserWithProjectsTransaction(
  userData: { name: string; email: string },
  projectNames: string[]
) {
  try {
    console.log('🚀 Starting batch user & project creation transaction...');
    const startTime = Date.now();

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          role: 'USER',
        },
      });

      // Create multiple projects for the user
      const projects = await Promise.all(
        projectNames.map((title) =>
          tx.project.create({
            data: {
              title,
              userId: user.id,
              status: 'active',
            },
          })
        )
      );

      return { user, projects };
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Transaction completed successfully in ${duration}ms`);

    return {
      success: true,
      duration,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Transaction failed. Rolling back:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * TRANSACTION EXAMPLE 3: Inventory Update with Validation
 * Demonstrates transaction rollback on validation failure
 */
export async function updateInventoryTransaction(
  productId: number,
  newStockLevel: number,
  warehouseLocation: string
) {
  try {
    console.log('🚀 Starting inventory update transaction...');
    const startTime = Date.now();

    const result = await prisma.$transaction(async (tx) => {
      // Validate: stock level cannot be negative
      if (newStockLevel < 0) {
        throw new Error('Stock level cannot be negative');
      }

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStockLevel },
      });

      // Update or create inventory record
      let inventory = await tx.inventory.findUnique({
        where: { productId },
      });

      if (inventory) {
        inventory = await tx.inventory.update({
          where: { productId },
          data: {
            warehouseLocation,
            lastRestockDate: new Date(),
          },
        });
      } else {
        inventory = await tx.inventory.create({
          data: {
            productId,
            warehouseLocation,
            lastRestockDate: new Date(),
            reorderLevel: Math.ceil(newStockLevel * 0.2), // Reorder at 20% of current stock
          },
        });
      }

      return { updatedProduct, inventory };
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Transaction completed successfully in ${duration}ms`);

    return {
      success: true,
      duration,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Transaction failed. Rolling back:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * TRANSACTION EXAMPLE 4: Complex Order Fulfillment
 * Multiple products, inventory checks, and payment processing
 */
export async function complexOrderTransaction(
  userId: number,
  orderItems: { productId: number; quantity: number }[]
) {
  try {
    console.log('🚀 Starting complex order fulfillment transaction...');
    const startTime = Date.now();

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const items = [];

      // Step 1: Validate all products and calculate total
      for (const item of orderItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, price: true, stock: true, name: true },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Have: ${product.stock}, Need: ${item.quantity}`
          );
        }

        totalAmount += product.price * item.quantity;
        items.push({ product, quantity: item.quantity });
      }

      // Step 2: Create order
      const order = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          totalAmount,
          status: 'confirmed',
        },
      });

      // Step 3: Create order items and update inventory
      const createdItems = [];
      for (const item of items) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          },
        });

        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } },
        });

        createdItems.push(orderItem);
      }

      // Step 4: Create payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          userId,
          amount: totalAmount,
          status: 'processing',
          method: 'credit_card',
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      });

      return {
        order,
        items: createdItems,
        payment,
        totalAmount,
      };
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Complex transaction completed successfully in ${duration}ms`);

    return {
      success: true,
      duration,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Complex transaction failed. Rolling back all changes:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * INTENTIONAL ROLLBACK TEST: Trigger error to verify rollback
 */
export async function testRollbackScenario(userId: number, productId: number) {
  try {
    console.log('🚀 Testing rollback scenario with intentional error...');

    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create order
      const order = await tx.order.create({
        data: {
          orderNumber: `TEST-ORD-${Date.now()}`,
          userId,
          totalAmount: 100,
          status: 'test',
        },
      });

      console.log('✓ Order created:', order.id);

      // Step 2: Create order item
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId,
          quantity: 5,
          price: 20,
        },
      });

      console.log('✓ Order item created:', orderItem.id);

      // Step 3: INTENTIONAL ERROR - This will cause rollback
      throw new Error(
        'SIMULATED ERROR: Testing rollback - all previous operations should be rolled back!'
      );

      // This code will never execute
      // return { order, orderItem };
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('✅ ROLLBACK TEST SUCCESSFUL - Error caught and transaction rolled back');
    console.log('Error message:', errorMessage);

    // Verify rollback by checking if records were created
    const orderCount = await prisma.order.count({
      where: { orderNumber: { contains: 'TEST-ORD' } },
    });

    console.log(`📊 Orders with TEST-ORD prefix: ${orderCount} (should be 0 if rollback worked)`);

    return {
      success: false,
      rollbackVerified: orderCount === 0,
      error: errorMessage,
    };
  }
}
