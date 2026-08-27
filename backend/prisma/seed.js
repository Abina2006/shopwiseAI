import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records (Optional, safe order)
  await prisma.priceHistory.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productListing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sellerReliability.deleteMany();

  // 2. Users are NOT seeded - only real users who register via the login page are stored

  // 3. Create Seller Reliability Stats
  const sellers = [
    {
      sellerName: 'Amazon',
      reliabilityScore: 4.8,
      totalReviews: 2450,
      avgDeliveryDays: 2.1,
      returnPolicyScore: 4.9
    },
    {
      sellerName: 'Flipkart',
      reliabilityScore: 4.2,
      totalReviews: 1980,
      avgDeliveryDays: 3.5,
      returnPolicyScore: 4.0
    },
    {
      sellerName: 'Croma',
      reliabilityScore: 4.5,
      totalReviews: 890,
      avgDeliveryDays: 1.8,
      returnPolicyScore: 4.3
    }
  ];

  for (const seller of sellers) {
    await prisma.sellerReliability.create({ data: seller });
  }

  // 4. Create Products
  const p1 = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro (128GB)',
      category: 'Electronics',
      brand: 'Apple',
      imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600',
      description: 'Aerospace-grade titanium design, A17 Pro Chip, and advanced 48MP main camera system.'
    }
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Sony WH-1000XM5 ANC Headphones',
      category: 'Audio',
      brand: 'Sony',
      imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600',
      description: 'Industry leading noise canceling wireless over-ear headphones with 30-hour battery life.'
    }
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Hoppup XO3 Gaming Wireless Earbuds 35ms Low Latency',
      category: 'Audio',
      brand: 'Hoppup',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600',
      description: 'Ultra-low 35ms latency gaming TWS earbuds with RGB breathing lights and deep bass.'
    }
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'boAt Airdopes 141 Bluetooth TWS Earbuds',
      category: 'Audio',
      brand: 'boAt',
      imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600',
      description: '42H total playtime, ASAP charge, ENx environmental noise cancellation technology.'
    }
  });

  const p5 = await prisma.product.create({
    data: {
      name: 'Samsung Galaxy Watch 6 Bluetooth 44mm',
      category: 'Wearables',
      brand: 'Samsung',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600',
      description: 'Personalized wellness and sleep coaching with advanced sapphire crystal glass display.'
    }
  });

  const p6 = await prisma.product.create({
    data: {
      name: 'Nike Air Zoom Pegasus 40 Running Shoes',
      category: 'Footwear',
      brand: 'Nike',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600',
      description: 'Responsive cushioning and breathable engineered mesh for everyday runners.'
    }
  });

  const p7 = await prisma.product.create({
    data: {
      name: 'Apple MacBook Air M2 (8GB / 256GB SSD)',
      category: 'Computers',
      brand: 'Apple',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600',
      description: 'Strikingly thin design with blazing-fast next-generation M2 chip and 13.6-inch Liquid Retina.'
    }
  });

  // 5. Create Listings for Products
  const l1_amazon = await prisma.productListing.create({
    data: {
      productId: p1.id,
      sellerName: 'Amazon',
      sellerUrl: 'https://amazon.in/dp/B0CHX12345',
      price: 129990.00,
      currency: 'INR',
      rating: 4.7,
      reviewCount: 312
    }
  });

  const l1_croma = await prisma.productListing.create({
    data: {
      productId: p1.id,
      sellerName: 'Croma',
      sellerUrl: 'https://croma.com/p/iphone15pro',
      price: 127999.00,
      currency: 'INR',
      rating: 4.5,
      reviewCount: 45
    }
  });

  const l2_amazon = await prisma.productListing.create({
    data: {
      productId: p2.id,
      sellerName: 'Amazon',
      sellerUrl: 'https://amazon.in/dp/B09XS8728S',
      price: 29990.00,
      currency: 'INR',
      rating: 4.8,
      reviewCount: 812
    }
  });

  const l2_flipkart = await prisma.productListing.create({
    data: {
      productId: p2.id,
      sellerName: 'Flipkart',
      sellerUrl: 'https://flipkart.com/sony-wh1000xm5',
      price: 28490.00,
      currency: 'INR',
      rating: 4.4,
      reviewCount: 204
    }
  });

  const l3_meesho = await prisma.productListing.create({
    data: {
      productId: p3.id,
      sellerName: 'Meesho',
      sellerUrl: 'https://www.meesho.com/hoppup-xo3-gaming-earbuds-with-35ms-low-latency/p/6p8x2z',
      price: 899.00,
      currency: 'INR',
      rating: 4.3,
      reviewCount: 428
    }
  });

  const l3_amazon = await prisma.productListing.create({
    data: {
      productId: p3.id,
      sellerName: 'Amazon',
      sellerUrl: 'https://amazon.in/dp/B0B6HPPXO3',
      price: 999.00,
      currency: 'INR',
      rating: 4.1,
      reviewCount: 185
    }
  });

  const l4_flipkart = await prisma.productListing.create({
    data: {
      productId: p4.id,
      sellerName: 'Flipkart',
      sellerUrl: 'https://flipkart.com/boat-airdopes-141',
      price: 1199.00,
      currency: 'INR',
      rating: 4.2,
      reviewCount: 15420
    }
  });

  const l4_amazon = await prisma.productListing.create({
    data: {
      productId: p4.id,
      sellerName: 'Amazon',
      sellerUrl: 'https://amazon.in/dp/B09N3ZNHTY',
      price: 1299.00,
      currency: 'INR',
      rating: 4.3,
      reviewCount: 8900
    }
  });

  const l5_amazon = await prisma.productListing.create({
    data: {
      productId: p5.id,
      sellerName: 'Amazon',
      sellerUrl: 'https://amazon.in/dp/B0CC9H821Y',
      price: 21999.00,
      currency: 'INR',
      rating: 4.5,
      reviewCount: 654
    }
  });

  const l6_nike = await prisma.productListing.create({
    data: {
      productId: p6.id,
      sellerName: 'Nike Official',
      sellerUrl: 'https://nike.com/in/t/air-zoom-pegasus-40',
      price: 8995.00,
      currency: 'INR',
      rating: 4.7,
      reviewCount: 1240
    }
  });

  const l7_apple = await prisma.productListing.create({
    data: {
      productId: p7.id,
      sellerName: 'Amazon',
      sellerUrl: 'https://amazon.in/dp/B0B3C58S43',
      price: 94990.00,
      currency: 'INR',
      rating: 4.8,
      reviewCount: 2450
    }
  });

  // 6. Create Price History Data
  const histories = [
    { listingId: l1_amazon.id, price: 134990.00, recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { listingId: l1_amazon.id, price: 129990.00, recordedAt: new Date() },
    { listingId: l2_amazon.id, price: 31990.00, recordedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
    { listingId: l2_amazon.id, price: 29990.00, recordedAt: new Date() },
    { listingId: l3_meesho.id, price: 1199.00, recordedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    { listingId: l3_meesho.id, price: 899.00, recordedAt: new Date() },
    { listingId: l4_flipkart.id, price: 1499.00, recordedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
    { listingId: l4_flipkart.id, price: 1199.00, recordedAt: new Date() }
  ];

  for (const hist of histories) {
    await prisma.priceHistory.create({ data: hist });
  }

  // 7. Create Reviews
  const reviews = [
    {
      listingId: l1_amazon.id,
      reviewerName: 'Rahul Sharma',
      rating: 5,
      reviewText: 'Perfect device! Camera quality is stellar and battery life easily lasts more than a day.',
      sentimentScore: 0.95,
      summarizedText: 'Highly satisfied with camera and battery performance.'
    },
    {
      listingId: l2_amazon.id,
      reviewerName: 'Ananya Verma',
      rating: 5,
      reviewText: 'Best active noise cancelling headphones on the market. Extremely comfortable for all-day listening.',
      sentimentScore: 0.98,
      summarizedText: 'Superb ANC and premium comfort.'
    },
    {
      listingId: l3_meesho.id,
      reviewerName: 'Vikram Singh',
      rating: 4.5,
      reviewText: 'Outstanding latency for BGMI and Free Fire gaming! Sound is punchy with great bass for this price point.',
      sentimentScore: 0.9,
      summarizedText: 'Great value gaming TWS with very low latency.'
    },
    {
      listingId: l3_meesho.id,
      reviewerName: 'Pooja Patel',
      rating: 4,
      reviewText: 'Battery backup is solid around 6 hours on a single charge. Comfortable fit in ears.',
      sentimentScore: 0.8,
      summarizedText: 'Good battery life and comfortable ear fit.'
    },
    {
      listingId: l4_flipkart.id,
      reviewerName: 'Karan Mehra',
      rating: 4,
      reviewText: 'Decent sound quality and mic is clear for work calls. Quick 5-min charging is very handy.',
      sentimentScore: 0.85,
      summarizedText: 'Good value daily earbuds with clear call quality.'
    },
    {
      listingId: l6_nike.id,
      reviewerName: 'Arjun Das',
      rating: 5,
      reviewText: 'Super lightweight and great rebound. Have logged over 150km without any wear issues.',
      sentimentScore: 0.95,
      summarizedText: 'Durable and highly responsive daily trainer.'
    }
  ];

  for (const rev of reviews) {
    await prisma.review.create({ data: rev });
  }

  // 8. Create Wishlists & Price Alerts
  await prisma.wishlist.create({
    data: {
      userId: user1.id,
      productId: p3.id
    }
  });

  await prisma.priceAlert.create({
    data: {
      userId: user1.id,
      listingId: l3_meesho.id,
      targetPrice: 799.00,
      isActive: true
    }
  });

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
