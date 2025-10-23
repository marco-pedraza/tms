import type { Meta, StoryObj } from '@storybook/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';

interface TableStoryProps {
  hasStickyColumn?: boolean;
}

/**
 * Wrapper component for Table stories that accepts hasStickyColumn prop
 */
function TableStory({ hasStickyColumn = false }: TableStoryProps) {
  return (
    <Table stickyLastColumn={hasStickyColumn}>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead className="w-[120px]">Status</TableHead>
          <TableHead className="w-[150px]">Method</TableHead>
          <TableHead className="w-[200px]">Customer</TableHead>
          <TableHead className="w-[100px]">Date</TableHead>
          <TableHead className="w-[120px]">Category</TableHead>
          <TableHead className="w-[100px]">Tax</TableHead>
          <TableHead className="w-[100px]">Discount</TableHead>
          <TableHead className="w-[120px]">Due Date</TableHead>
          <TableHead className="w-[100px]">Priority</TableHead>
          <TableHead className="w-[150px]">Department</TableHead>
          <TableHead className="w-[120px]">Project</TableHead>
          <TableHead className="w-[100px]">Currency</TableHead>
          <TableHead className="w-[120px]">Payment Terms</TableHead>
          <TableHead className="w-[100px]">Vendor</TableHead>
          <TableHead className="w-[120px]">Location</TableHead>
          <TableHead className="w-[100px]">Approved By</TableHead>
          <TableHead className="w-[120px]">Notes</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell>Acme Corporation</TableCell>
          <TableCell>2024-01-15</TableCell>
          <TableCell>Services</TableCell>
          <TableCell>$40.00</TableCell>
          <TableCell>$0.00</TableCell>
          <TableCell>2024-02-15</TableCell>
          <TableCell>High</TableCell>
          <TableCell>Sales</TableCell>
          <TableCell>Alpha Project</TableCell>
          <TableCell>USD</TableCell>
          <TableCell>Net 30</TableCell>
          <TableCell>TechCorp</TableCell>
          <TableCell>New York</TableCell>
          <TableCell>John Doe</TableCell>
          <TableCell>Urgent delivery</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell>Tech Solutions Ltd</TableCell>
          <TableCell>2024-01-20</TableCell>
          <TableCell>Products</TableCell>
          <TableCell>$24.00</TableCell>
          <TableCell>$15.00</TableCell>
          <TableCell>2024-02-20</TableCell>
          <TableCell>Medium</TableCell>
          <TableCell>Marketing</TableCell>
          <TableCell>Beta Project</TableCell>
          <TableCell>EUR</TableCell>
          <TableCell>Net 15</TableCell>
          <TableCell>SupplyCo</TableCell>
          <TableCell>London</TableCell>
          <TableCell>Jane Smith</TableCell>
          <TableCell>Standard order</TableCell>
          <TableCell className="text-right">$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV003</TableCell>
          <TableCell>Unpaid</TableCell>
          <TableCell>Bank Transfer</TableCell>
          <TableCell>Global Industries</TableCell>
          <TableCell>2024-01-25</TableCell>
          <TableCell>Consulting</TableCell>
          <TableCell>$56.00</TableCell>
          <TableCell>$0.00</TableCell>
          <TableCell>2024-02-25</TableCell>
          <TableCell>High</TableCell>
          <TableCell>Operations</TableCell>
          <TableCell>Gamma Project</TableCell>
          <TableCell>GBP</TableCell>
          <TableCell>Net 45</TableCell>
          <TableCell>ConsultCorp</TableCell>
          <TableCell>Tokyo</TableCell>
          <TableCell>Mike Johnson</TableCell>
          <TableCell>Complex requirements</TableCell>
          <TableCell className="text-right">$350.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV004</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell>Digital Dynamics</TableCell>
          <TableCell>2024-01-30</TableCell>
          <TableCell>Software</TableCell>
          <TableCell>$72.00</TableCell>
          <TableCell>$45.00</TableCell>
          <TableCell>2024-03-01</TableCell>
          <TableCell>Low</TableCell>
          <TableCell>IT</TableCell>
          <TableCell>Delta Project</TableCell>
          <TableCell>CAD</TableCell>
          <TableCell>Net 30</TableCell>
          <TableCell>SoftVendor</TableCell>
          <TableCell>Toronto</TableCell>
          <TableCell>Sarah Wilson</TableCell>
          <TableCell>License renewal</TableCell>
          <TableCell className="text-right">$450.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV005</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell>Innovation Labs</TableCell>
          <TableCell>2024-02-05</TableCell>
          <TableCell>Research</TableCell>
          <TableCell>$88.00</TableCell>
          <TableCell>$55.00</TableCell>
          <TableCell>2024-03-05</TableCell>
          <TableCell>Medium</TableCell>
          <TableCell>R&D</TableCell>
          <TableCell>Epsilon Project</TableCell>
          <TableCell>JPY</TableCell>
          <TableCell>Net 60</TableCell>
          <TableCell>ResearchCorp</TableCell>
          <TableCell>Berlin</TableCell>
          <TableCell>David Brown</TableCell>
          <TableCell>Experimental phase</TableCell>
          <TableCell className="text-right">$550.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV006</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>Bank Transfer</TableCell>
          <TableCell>Creative Agency</TableCell>
          <TableCell>2024-02-10</TableCell>
          <TableCell>Design</TableCell>
          <TableCell>$32.00</TableCell>
          <TableCell>$20.00</TableCell>
          <TableCell>2024-03-10</TableCell>
          <TableCell>High</TableCell>
          <TableCell>Creative</TableCell>
          <TableCell>Zeta Project</TableCell>
          <TableCell>AUD</TableCell>
          <TableCell>Net 20</TableCell>
          <TableCell>DesignCorp</TableCell>
          <TableCell>Sydney</TableCell>
          <TableCell>Lisa Garcia</TableCell>
          <TableCell>Brand redesign</TableCell>
          <TableCell className="text-right">$200.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV007</TableCell>
          <TableCell>Unpaid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell>Startup Ventures</TableCell>
          <TableCell>2024-02-15</TableCell>
          <TableCell>Training</TableCell>
          <TableCell>$48.00</TableCell>
          <TableCell>$0.00</TableCell>
          <TableCell>2024-03-15</TableCell>
          <TableCell>Medium</TableCell>
          <TableCell>HR</TableCell>
          <TableCell>Eta Project</TableCell>
          <TableCell>CHF</TableCell>
          <TableCell>Net 30</TableCell>
          <TableCell>TrainingCorp</TableCell>
          <TableCell>Zurich</TableCell>
          <TableCell>Robert Lee</TableCell>
          <TableCell>Team development</TableCell>
          <TableCell className="text-right">$300.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={18}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

const meta = {
  title: 'Components/Table',
  component: TableStory,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    hasStickyColumn: {
      control: 'boolean',
      description: 'Whether to show a sticky column (last column)',
      defaultValue: false,
    },
  },
} satisfies Meta<TableStoryProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    hasStickyColumn: false,
  },
};

export const WithStickyActions: Story = {
  args: {
    hasStickyColumn: true,
  },
  render: ({ hasStickyColumn }) => (
    <div className="w-full">
      <Table stickyLastColumn={hasStickyColumn}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">SKU</TableHead>
            <TableHead className="w-[200px]">Product Name</TableHead>
            <TableHead className="w-[150px]">Category</TableHead>
            <TableHead className="w-[120px]">Brand</TableHead>
            <TableHead className="w-[100px]">Price</TableHead>
            <TableHead className="w-[80px]">Stock</TableHead>
            <TableHead className="w-[100px]">Min Stock</TableHead>
            <TableHead className="w-[120px]">Supplier</TableHead>
            <TableHead className="w-[100px]">Location</TableHead>
            <TableHead className="w-[100px]">Last Updated</TableHead>
            <TableHead className="w-[100px] pr-8">Status</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">ABC123</TableCell>
            <TableCell>Wireless Bluetooth Headphones</TableCell>
            <TableCell>Electronics</TableCell>
            <TableCell>TechBrand</TableCell>
            <TableCell>$99.99</TableCell>
            <TableCell>45</TableCell>
            <TableCell>10</TableCell>
            <TableCell>ElectroSupply Co.</TableCell>
            <TableCell>Warehouse A</TableCell>
            <TableCell>2024-12-15</TableCell>
            <TableCell className="pr-8">In Stock</TableCell>
            <TableCell>
              <div className="flex gap-0.5">
                <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                  <Pencil className="w-[14px] h-[14px]" />
                </button>
                <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                  <Eye className="w-[14px] h-[14px]" />
                </button>
                <button className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors">
                  <Trash2 className="w-[14px] h-[14px]" />
                </button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">DEF456</TableCell>
            <TableCell>Ergonomic Office Chair</TableCell>
            <TableCell>Furniture</TableCell>
            <TableCell>ComfortPro</TableCell>
            <TableCell>$299.99</TableCell>
            <TableCell>12</TableCell>
            <TableCell>5</TableCell>
            <TableCell>Furniture Direct</TableCell>
            <TableCell>Warehouse B</TableCell>
            <TableCell>2024-12-14</TableCell>
            <TableCell className="pr-8">Low Stock</TableCell>
            <TableCell>
              <div className="flex gap-0.5">
                <button className="p-2 text-primary hover:text-primary/80 hover:bg-primary-light/15 rounded transition-colors">
                  <Pencil className="w-[14px] h-[14px]" />
                </button>
                <button className="p-2 text-primary hover:text-primary/80 hover:bg-primary-light/15 rounded transition-colors">
                  <Eye className="w-[14px] h-[14px]" />
                </button>
                <button className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors">
                  <Trash2 className="w-[14px] h-[14px]" />
                </button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">GHI789</TableCell>
            <TableCell>Mechanical Gaming Keyboard</TableCell>
            <TableCell>Electronics</TableCell>
            <TableCell>GameTech</TableCell>
            <TableCell>$149.99</TableCell>
            <TableCell>0</TableCell>
            <TableCell>8</TableCell>
            <TableCell>TechSupply Inc.</TableCell>
            <TableCell>Warehouse A</TableCell>
            <TableCell>2024-12-13</TableCell>
            <TableCell className="pr-8">Out of Stock</TableCell>
            <TableCell>
              <div className="flex gap-0.5">
                <button className="p-2 text-primary hover:text-primary/80 hover:bg-primary-light/15 rounded transition-colors">
                  <Pencil className="w-[14px] h-[14px]" />
                </button>
                <button className="p-2 text-primary hover:text-primary/80 hover:bg-primary-light/15 rounded transition-colors">
                  <Eye className="w-[14px] h-[14px]" />
                </button>
                <button className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors">
                  <Trash2 className="w-[14px] h-[14px]" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithStickyActionsInBox: Story = {
  args: {
    hasStickyColumn: true,
  },

  render: ({ hasStickyColumn }) => (
    <div className="w-full">
      {/* Box example with HTML + Tailwind - replace with real Card component from other repo */}
      <div className="bg-white rounded-xl shadow-lg border p-6 border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          Product Inventory
        </h3>
        <div className="p-0">
          <Table stickyLastColumn={hasStickyColumn}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] ml-4">SKU</TableHead>
                <TableHead className="w-[200px]">Product Name</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
                <TableHead className="w-[120px]">Brand</TableHead>
                <TableHead className="w-[100px]">Price</TableHead>
                <TableHead className="w-[80px]">Stock</TableHead>
                <TableHead className="w-[100px]">Min Stock</TableHead>
                <TableHead className="w-[120px]">Supplier</TableHead>
                <TableHead className="w-[100px]">Location</TableHead>
                <TableHead className="w-[100px]">Last Updated</TableHead>
                <TableHead className="w-[100px] pr-8">Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium ml-4">ABC123</TableCell>
                <TableCell>Wireless Bluetooth Headphones</TableCell>
                <TableCell>Electronics</TableCell>
                <TableCell>TechBrand</TableCell>
                <TableCell>$99.99</TableCell>
                <TableCell>45</TableCell>
                <TableCell>10</TableCell>
                <TableCell>ElectroSupply Co.</TableCell>
                <TableCell>Warehouse A</TableCell>
                <TableCell>2024-12-15</TableCell>
                <TableCell className="pr-8">In Stock</TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                      <Pencil className="w-[14px] h-[14px]" />
                    </button>
                    <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                      <Eye className="w-[14px] h-[14px]" />
                    </button>
                    <button className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors">
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium ml-4">DEF456</TableCell>
                <TableCell>Ergonomic Office Chair</TableCell>
                <TableCell>Furniture</TableCell>
                <TableCell>ComfortPro</TableCell>
                <TableCell>$299.99</TableCell>
                <TableCell>12</TableCell>
                <TableCell>5</TableCell>
                <TableCell>Furniture Direct</TableCell>
                <TableCell>Warehouse B</TableCell>
                <TableCell>2024-12-14</TableCell>
                <TableCell className="pr-8">Low Stock</TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                      <Pencil className="w-[14px] h-[14px]" />
                    </button>
                    <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                      <Eye className="w-[14px] h-[14px]" />
                    </button>
                    <button className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors">
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium ml-4">GHI789</TableCell>
                <TableCell>Mechanical Gaming Keyboard</TableCell>
                <TableCell>Electronics</TableCell>
                <TableCell>GameTech</TableCell>
                <TableCell>$149.99</TableCell>
                <TableCell>0</TableCell>
                <TableCell>8</TableCell>
                <TableCell>TechSupply Inc.</TableCell>
                <TableCell>Warehouse A</TableCell>
                <TableCell>2024-12-13</TableCell>
                <TableCell className="pr-8">Out of Stock</TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                      <Pencil className="w-[14px] h-[14px]" />
                    </button>
                    <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                      <Eye className="w-[14px] h-[14px]" />
                    </button>
                    <button className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors">
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  ),
};
