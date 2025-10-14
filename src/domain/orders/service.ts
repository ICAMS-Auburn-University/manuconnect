'use server';

import { Resend } from 'resend';

import { env } from '@/lib/config/env';
import { logger } from '@/lib/logger';
import { Order } from '@/domain/orders/types';
import { OrderStatus, EventType } from '@/types/enums';
import { createEvent } from '@/domain/events/service';
import { getUserById } from '@/services/integrations/supabaseAdmin';
import { OrderUpdateEmail } from '@/components/emails/order-update';
import { NewOrderConfirmation } from '@/components/emails/order-created-confirmation';
import { OrderShippedEmail } from '@/components/emails/order-shipped';
import {
  getCurrentUser,
  getLatestOrderNumber,
  insertOrder,
  updateOrderById,
  fetchOrdersByCreator,
  fetchOrdersByManufacturer,
  fetchUnclaimedOrders,
  fetchOrderById,
} from '@/lib/supabase/orders';

const createResendClient = () => {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(env.RESEND_API_KEY);
};

export async function createOrder(data: Order) {
  let newOrderNumber = 1;
  const { user, error: UserError } = await getCurrentUser();

  if (UserError) {
    logger.error(UserError, 'orders:createOrder:getUser');
    return { data: null, error: UserError };
  }
  if (!user) {
    return { data: null, error: 'User data not found' };
  }
  if (!data) {
    return { data: null, error: 'Order data not provided' };
  }

  const userId = user.id;
  try {
    // Get the latest order number
    const { data: latestOrder, error: latestOrderError } =
      await getLatestOrderNumber();

    if (latestOrderError) {
      logger.error(latestOrderError, 'orders:createOrder:latestOrder');
    } else {
      newOrderNumber = latestOrder ? latestOrder.id + 1 : 1;
    }

    const orderToInsert = {
      id: newOrderNumber,
      title: data.title,
      description: data.description,
      creator: user.id,
      creator_name: user.user_metadata.display_name,
      status: OrderStatus.OrderCreated,
      created_at: new Date(),
      last_update: new Date(),
      manufacturer: undefined,
      due_date: data.due_date,
      fileURLs: data.fileURLs,
      quantity: data.quantity,
      tags: data.tags,
      delivery_address: data.delivery_address,
    };

    const { data: OrderData, error: OrderError } =
      await insertOrder(orderToInsert);

    if (!OrderData || OrderError) {
      logger.error(OrderError, 'orders:createOrder:insert');
      return { data: null, error: OrderError };
    }

    logger.info(`Order #${newOrderNumber} created`);

    // Send Email
    const resend = createResendClient();

    // Send email to creator
    await resend.emails.send({
      from: 'ManuConnect <alerts@noreply.manuconnect.org>',
      to: [user.email || 'default@example.com'],
      subject: 'Order Confirmation',
      react: await NewOrderConfirmation({
        order: OrderData[0],
        email: user.email || 'default@example.com',
      }),
    });

    // Create Event
    await createEvent({
      eventType: EventType.SUCCESS,
      description: `Order #${newOrderNumber.toLocaleString('en-US', {
        minimumIntegerDigits: 6,
        useGrouping: false,
      })} created`,
      userId: userId,
      orderId: String(newOrderNumber),
    });

    return { data: OrderData, error: OrderError };
  } catch (error) {
    logger.error(error, 'orders:createOrder');
    return { data: null, error };
  }
}

export async function updateOrder(params: Partial<Order>) {
  try {
    const updateData = {
      ...params,
      last_update: new Date(),
    };

    const { data: OrderData, error: OrderError } = await updateOrderById(
      params.id as number,
      updateData
    );

    if (!OrderData) {
      return { data: null, error: OrderError };
    }

    // Emails for order status updates
    // Check if status is updated, but exclude OrderCreated -> ManufacturerOffer and ManufacturerOffer -> OrderAccepted and QualityCheck -> OrderShipped
    if (
      updateData.status !== undefined &&
      updateData.status !== OrderStatus.ManufacturerOffer &&
      updateData.status !== OrderStatus.OrderAccepted &&
      updateData.status !== OrderStatus.Shipped
    ) {
      const UserData = await getUserById(OrderData[0].creator);
      const resend = createResendClient();

      logger.info('Sending email for order update');
      // Send email to creator
      await resend.emails.send({
        from: 'ManuConnect <alerts@noreply.manuconnect.org>',
        to: [UserData?.user.email || 'default@example.com'],
        subject: 'Order Update',
        react: await OrderUpdateEmail({
          order: OrderData[0],
          email: UserData?.user.email || 'default@example.com',
        }),
      });
    }

    // Email if status changes from QualityCheck -> OrderShipped
    if (updateData.status === OrderStatus.Shipped) {
      const UserData = await getUserById(OrderData[0].creator);
      const resend = createResendClient();

      await resend.emails.send({
        from: 'ManuConnect <alerts@noreply.manuconnect.org>',
        to: [UserData?.user.email || 'default@example.com'],
        subject: 'Order Shipped!',
        react: await OrderShippedEmail({
          order: OrderData[0],
          email: UserData?.user.email || 'default@example.com',
        }),
      });

      await createEvent({
        eventType: EventType.SUCCESS,
        description: `Order #${params.id?.toLocaleString('en-US', {
          minimumIntegerDigits: 6,
          useGrouping: false,
        })} has been shipped`,
        userId: OrderData[0].creator,
        orderId: String(params.id),
      });
    }

    logger.info(
      `Order #${params.id?.toLocaleString('en-US', {
        minimumIntegerDigits: 6,
        useGrouping: false,
      })} updated`
    );
    return { data: OrderData, error: OrderError };
  } catch (error) {
    logger.error(error, 'orders:updateOrder');
    return { data: null, error };
  }
}

export async function getCreatorOrders() {
  const { user, error: UserError } = await getCurrentUser();

  if (UserError) {
    logger.error(UserError, 'orders:getCreatorOrders:getUser');
    return null;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await fetchOrdersByCreator(user.id);

  if (!data) {
    return null;
  }

  if (error) {
    logger.error(error, 'orders:getCreatorOrders:query');
    return null;
  }

  const orders: Order[] = data;
  return orders;
}

export async function getManufacturerOrders() {
  const { user, error: UserError } = await getCurrentUser();

  if (UserError) {
    logger.error(UserError, 'orders:getManufacturerOrders:getUser');
    return null;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await fetchOrdersByManufacturer(user.id);

  if (!data) {
    return null;
  }

  if (error) {
    logger.error(error, 'orders:getManufacturerOrders:query');
    return null;
  }

  const orders: Order[] = data;
  return orders;
}

export async function getUnclaimedOrders() {
  const { user, error: UserError } = await getCurrentUser();

  if (UserError) {
    logger.error(UserError, 'orders:getUnclaimedOrders:getUser');
    return null;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await fetchUnclaimedOrders();

  if (error) {
    logger.error(error, 'orders:getUnclaimedOrders:query');
    return null;
  }

  const ordersWithCreators = data
    ? await Promise.all(
        data.map((order) =>
          getUserById(order.creator).then((creator) => ({
            ...order,
            creator_name: creator.user.user_metadata.display_name || 'Unknown',
            creator_email: creator.user.email || 'Unknown',
          }))
        )
      )
    : [];

  const orders: Order[] = ordersWithCreators;
  return orders;
}

export async function getOrderById(orderId: string) {
  const { user, error: UserError } = await getCurrentUser();

  if (UserError) {
    logger.error(UserError, 'orders:getOrderById:getUser');
    return null;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await fetchOrderById(orderId, user.id);

  if (!data) {
    return null;
  }

  if (error) {
    logger.error(error, 'orders:getOrderById:query');
    return null;
  }

  // Get the user data for the creator and manufacturer
  const CreatorData = await getUserById(data.creator);

  const ManufacturerData = data.manufacturer
    ? await getUserById(data.manufacturer)
    : null;

  if (!CreatorData) {
    logger.error(
      'Failed to retrieve creator data',
      'orders:getOrderById:creator'
    );
  }

  data.creatorName = CreatorData?.user.user_metadata.displayName || 'Unknown';

  data.manufacturerName =
    data.manufacturer && ManufacturerData
      ? ManufacturerData.user.user_metadata.displayName
      : 'Unknown';

  const order: Order = data;
  return order;
}
