import { OrderStatus } from '@/lib/definitions';
import { Separator } from './ui/separator';

const ManufacturerOrderProgressBar = ({
  currentStatus,
}: {
  currentStatus: OrderStatus;
}) => {
  const statuses = [
    OrderStatus.OrderCreated,
    OrderStatus.ManufacturerOffer,
    OrderStatus.OrderAccepted,
    OrderStatus.MachineSetup,
    OrderStatus.StartedManufacturing,
    OrderStatus.QualityCheck,
    OrderStatus.Shipped,
    OrderStatus.Completed,
  ];

  const currentStep = statuses.indexOf(currentStatus);

  return (
    <div className="w-full">
      <div className="relative flex justify-between">
        {statuses.map((status, index) => (
          <div key={status} className="flex flex-col items-center z-10">
            <div
              className={`h-4 w-4 rounded-full ${
                index <= currentStep ? 'bg-brand' : 'bg-muted'
              }`}
            ></div>
            <span
              className={`text-xs mt-2 text-center max-w-16 ${
                index <= currentStep ? 'text-brand' : 'text-muted-foreground'
              }`}
            >
              {status}
            </span>
          </div>
        ))}

        {/* Connecting bars */}
        <div className="absolute top-2 left-0 right-0 flex justify-between z-0">
          {statuses.map(
            (_, index) =>
              index < statuses.length - 1 && (
                <div
                  key={`bar-${index}`}
                  className={`h-[2px] flex-1 mx-2 ${
                    index < currentStep ? 'bg-brand' : 'bg-muted'
                  }`}
                ></div>
              )
          )}
        </div>
      </div>
    </div>
  );
};

export default ManufacturerOrderProgressBar;
