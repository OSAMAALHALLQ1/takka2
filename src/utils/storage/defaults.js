export const DEFAULT_TABLES = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `طاولة ${i + 1}`,
  seats: i < 5 ? 4 : i < 10 ? 6 : 8,
  area: i < 5 ? 'indoor' : i < 10 ? 'outdoor' : 'terrace',
  status: 'empty',
  currentOrder: [],
  notes: '',
  subtotal: 0,
  tax: 0,
  serviceCharge: 0,
  total: 0,
  waiterCode: null,
  seatedAt: null,
  guests: 0
}));

export const DEFAULT_DEPARTMENTS = [
  {
    id: 'kitchen',
    name: 'المطبخ',
    nameEn: 'Kitchen',
    icon: '🍳',
    image: '🍳',
    color: '#e67e22',
    description: 'قسم الطعام الرئيسي والوجبات',
    workHours: '08:00 - 23:00',
    activeOrders: 0,
    lastOrderAt: null
  },
  {
    id: 'bar',
    name: 'البار',
    nameEn: 'Bar',
    icon: '🍺',
    image: '🍺',
    color: '#1abc9c',
    description: 'قسم المشروبات والعصائر',
    workHours: '08:00 - 24:00',
    activeOrders: 0,
    lastOrderAt: null
  },
  {
    id: 'shisha',
    name: 'الشيشة',
    nameEn: 'Shisha',
    icon: '💨',
    image: '💨',
    color: '#27ae60',
    description: 'قسم الشيشة والأرجيلة',
    workHours: '14:00 - 02:00',
    activeOrders: 0,
    lastOrderAt: null
  }
];

export const DEFAULT_MENU = [
  // Kitchen items
  { id: 'k1', nameAr: 'برغر كلاسيكي', nameEn: 'Classic Burger', name: 'برغر كلاسيكي', category: 'mains', price: 8, description: 'برغر لحم مع جبنة وصوص تكة', image: '🍔', department: 'kitchen', available: true, prepTime: 15 },
  { id: 'k2', nameAr: 'برغر جبن مضاعف', nameEn: 'Double Cheese Burger', name: 'برغر جبن مضاعف', category: 'mains', price: 10, description: 'برغر بطبقتين جبنة ولحم أصيل', image: '🍔', department: 'kitchen', available: true, prepTime: 18 },
  { id: 'k3', nameAr: 'شاورما دجاج', nameEn: 'Chicken Shawarma', name: 'شاورما دجاج', category: 'mains', price: 7, description: 'شاورما دجاج بخبز صاج وثومية', image: '🌯', department: 'kitchen', available: true, prepTime: 12 },
  { id: 'k4', nameAr: 'شاورما لحم', nameEn: 'Meat Shawarma', name: 'شاورما لحم', category: 'mains', price: 8, description: 'شاورما لحم بهوية وصلصة حارة', image: '🌯', department: 'kitchen', available: true, prepTime: 14 },
  { id: 'k5', nameAr: 'بيتزا مارغريتا', nameEn: 'Margherita Pizza', name: 'بيتزا مارغريتا', category: 'mains', price: 12, description: 'صلصة طماطم وموزاريلا وريحان', image: '🍕', department: 'kitchen', available: true, prepTime: 20 },
  { id: 'k6', nameAr: 'بيتزا ببيروني', nameEn: 'Pepperoni Pizza', name: 'بيتزا ببيروني', category: 'mains', price: 14, description: 'ببيروني فاخر مع موزاريلا طازجة', image: '🍕', department: 'kitchen', available: true, prepTime: 22 },
  { id: 'k7', nameAr: 'فريز دجاج', nameEn: 'Crispy Chicken', name: 'فريز دجاج', category: 'appetizers', price: 6, description: 'دجاج مقرمش مع بطاطا ذهبية', image: '🍗', department: 'kitchen', available: true, prepTime: 15 },
  { id: 'k8', nameAr: 'دجاج مشوي', nameEn: 'Grilled Chicken', name: 'دجاج مشوي', category: 'mains', price: 10, description: 'نصف دجاجة مشوية مع أعشاب', image: '🍗', department: 'kitchen', available: true, prepTime: 25 },
  { id: 'k9', nameAr: 'سلطة خضار', nameEn: 'Garden Salad', name: 'سلطة خضار', category: 'appetizers', price: 5, description: 'سلطة طازجة مع توابل البيت', image: '🥗', department: 'kitchen', available: true, prepTime: 8 },
  // Bar items
  { id: 'b1', nameAr: 'كولا صغير', nameEn: 'Cola Small', name: 'كولا صغير', category: 'drinks', price: 2, description: 'مشروب كولا بارد', image: '🥤', department: 'bar', available: true, prepTime: 2 },
  { id: 'b2', nameAr: 'كولا كبير', nameEn: 'Cola Large', name: 'كولا كبير', category: 'drinks', price: 3, description: 'مشروب كولا بارد حجم كبير', image: '🥤', department: 'bar', available: true, prepTime: 2 },
  { id: 'b3', nameAr: 'عصير برتقال', nameEn: 'Orange Juice', name: 'عصير برتقال', category: 'drinks', price: 4, description: 'عصير برتقال طبيعي طازج', image: '🍊', department: 'bar', available: true, prepTime: 5 },
  { id: 'b4', nameAr: 'عصير ليمون', nameEn: 'Lemon Juice', name: 'عصير ليمون', category: 'drinks', price: 3.5, description: 'عصير ليمون منعش', image: '🍋', department: 'bar', available: true, prepTime: 5 },
  { id: 'b5', nameAr: 'عصير تفاح', nameEn: 'Apple Juice', name: 'عصير تفاح', category: 'drinks', price: 4, description: 'عصير تفاح حلو طازج', image: '🍎', department: 'bar', available: true, prepTime: 4 },
  { id: 'b6', nameAr: 'ليموناضة طازة', nameEn: 'Fresh Lemonade', name: 'ليموناضة طازة', category: 'drinks', price: 4, description: 'ليمون منعش بالنعناع والثلج', image: '🍹', department: 'bar', available: true, prepTime: 6 },
  { id: 'b7', nameAr: 'ماء معدني', nameEn: 'Mineral Water', name: 'ماء معدني', category: 'drinks', price: 2, description: 'زجاجة ماء معدني بارد', image: '💧', department: 'bar', available: true, prepTime: 1 },
  { id: 'b8', nameAr: 'قهوة عربية', nameEn: 'Arabic Coffee', name: 'قهوة عربية', category: 'drinks', price: 3, description: 'قهوة عربية أصيلة بالهيل', image: '☕', department: 'bar', available: true, prepTime: 5 },
  { id: 'b9', nameAr: 'شاي بالنعناع', nameEn: 'Mint Tea', name: 'شاي بالنعناع', category: 'drinks', price: 2.5, description: 'شاي أسود بأوراق النعناع الطازجة', image: '🍵', department: 'bar', available: true, prepTime: 5 },
  // Shisha items
  { id: 's1', nameAr: 'شيشة تفاحتين', nameEn: 'Double Apple Shisha', name: 'شيشة تفاحتين', category: 'shisha', price: 15, description: 'نكهة تفاحتين كلاسيكية', image: '💨', department: 'shisha', available: true, prepTime: 10 },
  { id: 's2', nameAr: 'شيشة نعناع', nameEn: 'Mint Shisha', name: 'شيشة نعناع', category: 'shisha', price: 15, description: 'نكهة نعناع منعشة وباردة', image: '🌿', department: 'shisha', available: true, prepTime: 10 },
  { id: 's3', nameAr: 'شيشة كريمة', nameEn: 'Cream Shisha', name: 'شيشة كريمة', category: 'shisha', price: 18, description: 'نكهة كريمة ناعمة فاخرة', image: '🍦', department: 'shisha', available: true, prepTime: 12 },
  { id: 's4', nameAr: 'شيشة فاكهة مشكلة', nameEn: 'Mixed Fruit Shisha', name: 'شيشة فاكهة مشكلة', category: 'shisha', price: 20, description: 'خلطة فواكه خاصة متنوعة', image: '🍓', department: 'shisha', available: true, prepTime: 12 },
  { id: 's5', nameAr: 'شيشة برتقال', nameEn: 'Orange Shisha', name: 'شيشة برتقال', category: 'shisha', price: 16, description: 'نكهة برتقال طازج وحامض', image: '🍊', department: 'shisha', available: true, prepTime: 10 },
  { id: 's6', nameAr: 'شيشة فراولة', nameEn: 'Strawberry Shisha', name: 'شيشة فراولة', category: 'shisha', price: 17, description: 'نكهة فراولة حلوة ومنعشة', image: '🍓', department: 'shisha', available: true, prepTime: 10 }
];

export const DEFAULT_EMPLOYEES = [
  { id: 'admin-1', name: 'مدير تكة', nameEn: 'Taka Manager', role: 'manager', username: 'admin', password: 'admin123', code: 'ADMIN', phone: '0790000000', email: 'admin@taka.com', salary: 0, active: true, lastLogin: null },
  { id: 'waiter-1', name: 'أحمد الجرسون', nameEn: 'Ahmed Waiter', role: 'waiter', username: 'waiter1', password: '1234', code: 'W-1234', phone: '0791234567', email: 'waiter1@taka.com', salary: 500, active: true, lastLogin: null },
  { id: 'cashier-1', name: 'سارة المحاسبة', nameEn: 'Sara Cashier', role: 'cashier', username: 'cashier1', password: '1234', code: 'C-5678', phone: '0781234567', email: 'cashier1@taka.com', salary: 600, active: true, lastLogin: null },
  { id: 'kitchen-1', name: 'خالد الطباخ', nameEn: 'Khaled Cook', role: 'kitchen', username: 'kitchen1', password: '1234', code: 'K-1111', phone: '0771111111', email: 'kitchen1@taka.com', salary: 550, active: true, lastLogin: null },
  { id: 'bar-1', name: 'محمد البار', nameEn: 'Mohammed Bar', role: 'bar', username: 'bar1', password: '1234', code: 'B-2222', phone: '0772222222', email: 'bar1@taka.com', salary: 480, active: true, lastLogin: null },
  { id: 'shisha-1', name: 'علي الشيشة', nameEn: 'Ali Shisha', role: 'shisha', username: 'shisha1', password: '1234', code: 'S-3333', phone: '0773333333', email: 'shisha1@taka.com', salary: 450, active: true, lastLogin: null }
];
