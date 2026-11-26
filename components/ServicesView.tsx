'use client';

import {
  ArrowDownToLine,
  ArrowRight,
  Plus,
  QrCode,
  ReceiptText,
  Smartphone,
  Star,
  Store,
} from 'lucide-react';
import { ModalType } from '@/lib/wallet-types';

interface ServicesViewProps {
  onOpenModal: (modal: ModalType) => void;
}

const ALL_SERVICES: {
  id: ModalType;
  label: string;
  description: string;
  tint: string;
  icon: 'send' | 'add' | 'cashout' | 'payment' | 'recharge' | 'qr' | 'bills' | 'offers';
}[] = [
  {
    id: 'send',
    label: 'Send Money',
    description: 'Transfer BDT to any contact',
    tint: 'bg-[#f0eaff] text-[#7136d5]',
    icon: 'send',
  },
  {
    id: 'add',
    label: 'Add Money',
    description: 'Top up your demo balance',
    tint: 'bg-[#e8f8f1] text-[#159b70]',
    icon: 'add',
  },
  {
    id: 'cashout',
    label: 'Cash Out',
    description: 'Withdraw via agent or ATM',
    tint: 'bg-[#fff0f5] text-[#df4d91]',
    icon: 'cashout',
  },
  {
    id: 'payment',
    label: 'Payment',
    description: 'Pay merchants & stores',
    tint: 'bg-[#eaf3ff] text-[#3979d8]',
    icon: 'payment',
  },
  {
    id: 'recharge',
    label: 'Recharge',
    description: 'Prepaid & postpaid top-up',
    tint: 'bg-[#eaf3ff] text-[#3979d8]',
    icon: 'recharge',
  },
  {
    id: 'qr',
    label: 'QR Pay',
    description: 'Scan merchant QR codes',
    tint: 'bg-[#f0eaff] text-[#7136d5]',
    icon: 'qr',
  },
  {
    id: 'bills',
    label: 'Pay Bills',
    description: 'Electricity, gas, & internet',
    tint: 'bg-[#e8f8f1] text-[#159b70]',
    icon: 'bills',
  },
  {
    id: 'offers',
    label: 'Offers',
    description: 'Cashback & seasonal deals',
    tint: 'bg-[#fff0f5] text-[#df4d91]',
    icon: 'offers',
  },
];

function ServiceIcon({ icon }: { icon: (typeof ALL_SERVICES)[number]['icon'] }) {
  switch (icon) {
    case 'send':
      return <ArrowRight className="h-5 w-5" aria-hidden="true" />;
    case 'add':
      return <Plus className="h-5 w-5" aria-hidden="true" />;
    case 'cashout':
      return <ArrowDownToLine className="h-5 w-5" aria-hidden="true" />;
    case 'payment':
      return <Store className="h-5 w-5" aria-hidden="true" />;
    case 'recharge':
      return <Smartphone className="h-5 w-5" aria-hidden="true" />;
    case 'qr':
      return <QrCode className="h-5 w-5" aria-hidden="true" />;
    case 'bills':
      return <ReceiptText className="h-5 w-5" aria-hidden="true" />;
    case 'offers':
      return <Star className="h-5 w-5" aria-hidden="true" />;
  }
}

export default function ServicesView({ onOpenModal }: ServicesViewProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="px-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#201735]">
          All services
        </h2>
        <p className="mt-1 text-xs text-[#6e6580]">
          Everything you need, in one place.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {ALL_SERVICES.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onOpenModal(service.id)}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2.5 rounded-[20px] bg-white p-4 text-center shadow-[0_5px_18px_rgba(51,32,91,0.04)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${service.tint}`}
            >
              <ServiceIcon icon={service.icon} />
            </span>
            <div>
              <p className="whitespace-nowrap text-xs font-bold text-[#201735]">
                {service.label}
              </p>
              <p className="mt-0.5 hidden text-[11px] text-[#6e6580] sm:block">
                {service.description}
              </p>
            </div>
          </button>
        ))}
      </section>

      <section className="rounded-[20px] bg-white p-5 shadow-[0_5px_18px_rgba(51,32,91,0.04)] sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h3 className="text-sm font-bold text-[#201735]">Need help?</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#6e6580]">
            Our support guide is ready to help you explore your NOTTPAY wallet experience.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenModal('help')}
          className="mt-4 min-h-[44px] w-full shrink-0 whitespace-nowrap rounded-xl border border-[#e9e3f1] bg-white px-5 py-2.5 text-xs font-bold text-[#6d28d9] transition-colors hover:border-[#d2c5ea] hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40 sm:mt-0 sm:w-auto"
        >
          Contact support
        </button>
      </section>
    </div>
  );
}
