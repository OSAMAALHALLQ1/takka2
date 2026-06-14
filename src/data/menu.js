export const menuCategories = [
  { id: 'mains', name: 'Main Dishes', icon: '🍔' },
  { id: 'appetizers', name: 'Appetizers', icon: '🍟' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'shisha', name: 'Shisha', icon: '💨' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' }
];

export const menuItems = [
  // Mains
  { id: 'm1', category: 'mains', name: 'Takka Double Burger Meal', price: 6.50, description: 'Flame-grilled beef, cheddar cheese, lettuce, tomato, special Takka sauce', image: '🍔', department: 'kitchen' },
  { id: 'm2', category: 'mains', name: 'Super Supreme Pizza', price: 7.00, description: 'Tomato sauce, mozzarella cheese, pepperoni, olives, green pepper', image: '🍕', department: 'kitchen' },
  { id: 'm3', category: 'mains', name: 'Super Chicken Shawarma', price: 4.00, description: 'Marinated chicken shawarma, garlic sauce, pickles, crispy saj bread', image: '🌯', department: 'kitchen' },
  { id: 'm4', category: 'mains', name: 'Chicken Alfredo Pasta', price: 5.50, description: 'Penne pasta, white cream sauce, grilled mushrooms, parmesan cheese', image: '🍝', department: 'kitchen' },
  { id: 'm5', category: 'mains', name: 'Crispy Chicken Meal', price: 5.00, description: '4 pieces crispy chicken, fries, garlic sauce, bread, coleslaw', image: '🍗', department: 'kitchen' },

  // Appetizers
  { id: 'a1', category: 'appetizers', name: 'Family Fries', price: 2.00, description: 'Crispy fries seasoned with Takka special spices', image: '🍟' },
  { id: 'a2', category: 'appetizers', name: 'Fried Mozzarella Sticks', price: 3.00, description: '5 pieces melted mozzarella sticks with marinara sauce', image: '🧀' },
  { id: 'a3', category: 'appetizers', name: 'Crispy Onion Rings', price: 2.50, description: 'Crispy fried onion rings served with ranch sauce', image: '🧅' },
  { id: 'a4', category: 'appetizers', name: 'Garlic Cheese Bread', price: 2.25, description: 'Toasted French bread with garlic, butter, and mozzarella cheese', image: '🧄' },

  // Drinks
  { id: 'd1', category: 'drinks', name: 'Cola / Sprite / Fanta', price: 1.00, description: 'Cold can 330ml', image: '🥤', department: 'bar' },
  { id: 'd2', category: 'drinks', name: 'Fresh Orange Juice', price: 2.50, description: 'Fresh orange juice 100% no additives', image: '🍊', department: 'bar' },
  { id: 'd3', category: 'drinks', name: 'Iced Lemon & Mint', price: 2.25, description: 'Fresh lemon blended with green mint and ice', image: '🍋', department: 'bar' },
  { id: 'd4', category: 'drinks', name: 'Mineral Water', price: 0.50, description: 'Cold mineral water bottle', image: '💧', department: 'bar' },
  { id: 'd5', category: 'drinks', name: 'Espresso / Americano', price: 1.50, description: 'Premium hot Italian coffee', image: '☕', department: 'bar' },

  // Desserts
  { id: 'e1', category: 'desserts', name: 'Nutella Chocolate Waffle', price: 3.50, description: 'Hot Belgian waffle topped with Nutella and strawberry slices', image: '🧇' },
  { id: 'e2', category: 'desserts', name: 'Nutella & Lotus Crepe', price: 4.00, description: 'Thin crepe filled with Nutella and topped with crushed Lotus biscuit', image: '🥞' },
  { id: 'e3', category: 'desserts', name: 'Fruit Salad with Ice Cream', price: 3.00, description: 'Fresh seasonal fruits with a scoop of vanilla ice cream', image: '🍧' }
];
