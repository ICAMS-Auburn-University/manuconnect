"use server";

import { Order, OrderStatus } from "@/lib/definitions";
import { getUserById } from "../adminUtils";
import { createClient } from "./server";
import { consoleLog } from "./utils";
import { createEvent } from "./events";
import { Resend } from "resend";
import { OrderUpdateEmail } from "@/components/emails/order-update";
import { NewOrderConfirmation } from "@/components/emails/order-created-confirmation";
import { OrderShippedEmail } from "@/components/emails/order-shipped";

export async function createOrder(data: Order) {
  const supabase = await createClient();
  let newOrderNumber = 1;
  const { data: UserData, error: UserError } = await supabase.auth.getUser();

  if (UserError) {
    console.error(UserError);
    return { data: null, error: UserError };
  }
  if (!UserData) {
    return { data: null, error: "User data not found" };
  }
  if (!data) {
    return { data: null, error: "Order data not provided" };
  }

  const userId = UserData?.user.id;
  try {
    // Get the latest order number
    const { data: latestOrder, error: latestOrderError } = await supabase
      .from("Orders")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (latestOrderError) {
      consoleLog(`${latestOrderError}`);
    } else {
      newOrderNumber = latestOrder.id + 1;
    }

    const { data: OrderData, error: OrderError } = await supabase
      .from("Orders")
      .insert({
        id: newOrderNumber,
        title: data.title,
        description: data.description,
        creator: (await supabase.auth.getUser()).data.user?.id,
        creator_name: (await supabase.auth.getUser()).data.user?.user_metadata
          .display_name,
        status: OrderStatus.OrderCreated,
        created_at: new Date(),
        last_update: new Date(),
        manufacturer: null,
        due_date: data.due_date,
        fileURLs: data.fileURLs,
        quantity: data.quantity,
        tags: data.tags,
        delivery_address: data.delivery_address,
      })
      .select();

    if (!OrderData || OrderError) {
      console.error(OrderError);
      return { data: null, error: OrderError };
    }

    consoleLog(`Order #${newOrderNumber} created`);

    // Send Email
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email to creator
    const { data: emailData } = await resend.emails.send({
      from: "ManuConnect <alerts@noreply.manuconnect.org>",
      to: [UserData?.user.email || "default@example.com"],
      subject: "Order Confirmation",
      react: await NewOrderConfirmation({
        order: OrderData[0],
        email: UserData?.user.email || "default@example.com",
      }),
    });

    // Create Event
    await createEvent(
      "success",
      `Order #${newOrderNumber.toLocaleString("en-US", {
        minimumIntegerDigits: 6,
        useGrouping: false,
      })} created`,
      userId,
      newOrderNumber
    );

    return { data: OrderData, error: OrderError };
  } catch (error) {
    console.error(error);
    return { data: null, error };
  }
}
// TODO: Update Params
/**
 *
 * @param params Object containing the order ID and any updatable fields (title, status, description, manufacturer, isArchived, etc.)
 *
 */
export async function updateOrder(params: Partial<Order>) {
  const supabase = await createClient();

  try {
    const updateData = {
      ...params,
      last_update: new Date(),
    };

    const { data: OrderData, error: OrderError } = await supabase
      .from("Orders")
      .update(updateData)
      .eq("id", params.id)
      .select();

    // Emails for order status updates

    // Check if status is updated, but exclude OrderCreated -> ManufacturerOffer and ManufacturerOffer -> OrderAccepted and QualityCheck -> OrderShipped
    if (
      OrderData &&
      updateData.status !== OrderStatus.ManufacturerOffer &&
      updateData.status !== OrderStatus.OrderAccepted &&
      updateData.status !== OrderStatus.Shipped
    ) {
      const UserData = await getUserById(OrderData[0].creator);
      const resend = new Resend(process.env.RESEND_API_KEY);

      console.log("Sending email for order update");
      // Send email to creator
      const { data: emailData } = await resend.emails.send({
        from: "ManuConnect <alerts@noreply.manuconnect.org>",
        to: [UserData?.user.email || "default@example.com"],
        subject: "Order Update",
        react: await OrderUpdateEmail({
          order: OrderData[0],
          email: UserData?.user.email || "default@example.com",
        }),
      });
    }

    // Email if status changes from QualityCheck -> OrderShipped
    if (OrderData && updateData.status === OrderStatus.Shipped) {
      const UserData = await getUserById(OrderData[0].creator);
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { data: emailData } = await resend.emails.send({
        from: "ManuConnect <alerts@noreply.manuconnect.org>",
        to: [UserData?.user.email || "default@example.com"],
        subject: "Order Shipped!",
        react: await OrderShippedEmail({
          order: OrderData[0],
          email: UserData?.user.email || "default@example.com",
        }),
      });

      createEvent(
        "shipment",
        `Order #${params.id?.toLocaleString("en-US", {
          minimumIntegerDigits: 6,
          useGrouping: false,
        })} has been shipped`,
        OrderData[0].creator,
        params.id
      );
    }

    consoleLog(
      `Order #${params.id?.toLocaleString("en-US", {
        minimumIntegerDigits: 6,
        useGrouping: false,
      })} updated`
    );
    return { data: OrderData, error: OrderError?.message };
  } catch (error) {
    console.error(error);
  }
}

export async function getCreatorOrders() {
  const supabase = await createClient();
  const { data: UserData, error: UserError } = await supabase.auth.getUser();

  if (UserError) {
    console.error(UserError);
    return null;
  }

  if (!UserData) {
    return null;
  }

  const { data, error } = await supabase
    .from("Orders")
    .select("*")
    .eq("creator", UserData?.user.id)
    .order("id", { ascending: true });

  if (!data) {
    return null;
  }

  if (error) {
    console.error(error);
    return null;
  }
  const orders: Order[] = data;

  return orders;
}

export async function getManufacturerOrders() {
  const supabase = await createClient();
  const { data: UserData, error: UserError } = await supabase.auth.getUser();

  if (UserError) {
    console.error(UserError);
    return null;
  }

  if (!UserData) {
    return null;
  }

  const { data, error } = await supabase
    .from("Orders")
    .select("*")
    .eq("manufacturer", UserData?.user.id)
    .order("id", { ascending: true });

  if (!data) {
    return null;
  }

  if (error) {
    console.error(error);
    return null;
  }

  const orders: Order[] = data;

  return orders;
}

/**
 * @returns Orders that are unclaimed with the creator name attached
 */
export async function getUnclaimedOrders() {
  const supabase = await createClient();
  const { data: UserData, error: UserError } = await supabase.auth.getUser();

  if (UserError) {
    console.error(UserError);
    return null;
  }

  if (!UserData) {
    return null;
  }

  const { data, error } = await supabase
    .from("Orders")
    .select("*")
    .is("manufacturer", null)
    .eq("isArchived", false);

  // Get the user data for the creator and manufacturer

  if (error) {
    console.error(error);
    return null;
  }

  const ordersWithCreators = await Promise.all(
    data.map((order) =>
      getUserById(order.creator).then((creator) => ({
        ...order,
        creator_name: creator.user.user_metadata.display_name || "Unknown",
        creator_email: creator.user.email || "Unknown",
      }))
    )
  );

  const orders: Order[] = ordersWithCreators;

  return orders;
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient();
  const { data: UserData, error: UserError } = await supabase.auth.getUser();

  if (UserError) {
    console.error(UserError);
    return null;
  }

  if (!UserData) {
    return null;
  }

  const { data, error } = await supabase
    .from("Orders")
    .select("*")
    .eq("id", orderId)
    .or(`creator.eq.${UserData.user.id},manufacturer.eq.${UserData.user.id}`)
    .single();

  if (!data) {
    return null;
  }

  // Get the user data for the creator and manufacturer
  const CreatorData = await getUserById(data.creator);

  const ManufacturerData = data.manufacturer
    ? await getUserById(data.manufacturer)
    : null;

  if (error) {
    console.error(error);
    return null;
  }

  if (!CreatorData) {
    console.error("Failed to retrieve creator data");
  }

  data.creatorName = CreatorData.user.user_metadata.displayName || "Unknown";

  data.manufacturerName =
    data.manufacturer && ManufacturerData
      ? ManufacturerData.user.user_metadata.displayName
      : "Unknown";

  const order: Order = data;

  return order;
}
