import type { AssembliesSchema, OrdersSchema } from '@/types/schemas';
import { OrderStatus } from '@/types/enums';
import { getAccountType } from '@/domain/users/service';
import {
  getCreatorOrders,
  getManufacturerOrders,
} from '@/domain/orders/service';
import { listAssembliesByOrderIds } from '@/domain/manufacturing/service';
import ActiveOrdersList from './ActiveOrdersList';
import type {
  ActiveOrderSummary,
  DerivedOrderStatus,
} from './active-orders.types';

const deriveStatus = (
  order: OrdersSchema,
  totalAssemblies: number,
  completedAssemblies: number,
  awaitingManufacturers: number
): Pick<ActiveOrderSummary, 'status' | 'statusDescription' | 'canArchive'> => {
  const status = order.status as OrderStatus;

  switch (status) {
    case OrderStatus.OrderCreated:
      if (totalAssemblies > 0) {
        return {
          status: 'Finding Manufacturers',
          statusDescription:
            awaitingManufacturers > 0
              ? `Awaiting manufacturers for ${awaitingManufacturers} assembly${
                  awaitingManufacturers === 1 ? '' : 'ies'
                }.`
              : 'Gathering manufacturer availability.',
          canArchive: false,
        };
      }
      return {
        status: 'Draft',
        statusDescription:
          'Finish configuring this order so manufacturers can review it.',
        canArchive: false,
      };
    case OrderStatus.ManufacturerOffer:
      return {
        status: 'Finding Manufacturers',
        statusDescription:
          awaitingManufacturers > 0
            ? `Awaiting manufacturers for ${awaitingManufacturers} assembly${
                awaitingManufacturers === 1 ? '' : 'ies'
              }.`
            : 'Gathering manufacturer availability.',
        canArchive: false,
      };
    case OrderStatus.OrderAccepted:
    case OrderStatus.MachineSetup:
    case OrderStatus.StartedManufacturing:
      return {
        status: 'Building In Progress',
        statusDescription: `Working with ${
          order.manufacturer_name || 'the assigned manufacturer'
        } on ${totalAssemblies || 0} assemblies.`,
        canArchive: false,
      };
    case OrderStatus.QualityCheck:
      return {
        status: 'Quality Check',
        statusDescription:
          'Manufacturers are validating tolerances before shipping.',
        canArchive: false,
      };
    case OrderStatus.Shipped:
      return {
        status: 'Shipping',
        statusDescription: 'Assemblies are on their way to the destination.',
        canArchive: false,
      };
    case OrderStatus.Completed:
      return {
        status: 'Completed',
        statusDescription:
          'All assemblies shipped. You can archive this order for reference.',
        canArchive: true,
      };
    default:
      return {
        status: 'Draft',
        statusDescription:
          'Publish this order so manufacturers can begin reviewing assemblies.',
        canArchive: false,
      };
  }
};

const groupAssemblies = (assemblies: AssembliesSchema[]) => {
  const map = new Map<string, AssembliesSchema[]>();
  assemblies.forEach((assembly) => {
    const list = map.get(assembly.order_id);
    if (list) {
      list.push(assembly);
    } else {
      map.set(assembly.order_id, [assembly]);
    }
  });
  return map;
};

const ActiveOrders = async () => {
  const accountType = (await getAccountType()) ?? 'creator';
  const fetchedOrders =
    accountType === 'manufacturer'
      ? await getManufacturerOrders()
      : await getCreatorOrders();

  const orders = (fetchedOrders ?? []).filter((order) => !order.isArchived);

  if (orders.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No active orders yet. Create an order to kick off production.
      </div>
    );
  }

  const orderIds = orders.map((order) => order.id);
  const assemblies = await listAssembliesByOrderIds(orderIds);
  const assemblyMap = groupAssemblies(assemblies);

  const summaries: ActiveOrderSummary[] = orders.map((order) => {
    const orderAssemblies = assemblyMap.get(order.id) ?? [];
    const totalAssemblies = orderAssemblies.length;
    const completedAssemblies = orderAssemblies.filter(
      (assembly) => assembly.specifications_completed
    ).length;
    const awaitingManufacturers =
      totalAssemblies > 0 && !order.manufacturer ? totalAssemblies : 0;
    const statusDetails = deriveStatus(
      order,
      totalAssemblies,
      completedAssemblies,
      awaitingManufacturers
    );

    return {
      order,
      totalAssemblies,
      completedAssemblies,
      awaitingManufacturers,
      ...statusDetails,
    };
  });

  return <ActiveOrdersList orders={summaries} />;
};

export default ActiveOrders;
