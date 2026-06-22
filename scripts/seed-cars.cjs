const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const cars = [
  { id: "hatch-001", name: "Volkswagen Polo", year: 2024, price: 89990, category: "Hatch", engine: "1.0 TSI Flex 12V", power: "116 cv", consumption: "12,5 km/l", weight: "1.062 kg", ipva: 2699, insurance: 3200, maintenance: 1800, features: ["Ar-condicionado", "Direção elétrica", "Vidros elétricos", "Central multimídia", "Bluetooth", "Volante multifuncional"], main_image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=400&q=80"] },
  { id: "hatch-002", name: "Fiat Argo", year: 2024, price: 79990, category: "Hatch", engine: "1.3 Firefly Flex 8V", power: "107 cv", consumption: "13,0 km/l", weight: "1.050 kg", ipva: 2399, insurance: 2800, maintenance: 1500, features: ["Ar-condicionado", "Direção elétrica", "Vidros elétricos", "Central multimídia", "Sensor de ré"], main_image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80"] },
  { id: "hatch-003", name: "Chevrolet Onix", year: 2024, price: 84990, category: "Hatch", engine: "1.0 Turbo Flex 12V", power: "116 cv", consumption: "12,8 km/l", weight: "1.045 kg", ipva: 2549, insurance: 3000, maintenance: 1600, features: ["Ar-condicionado", "Direção elétrica", "Vidros elétricos", "Central multimídia", "Wi-Fi nativo", "OnStar"], main_image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80"] },
  { id: "sedan-001", name: "Toyota Corolla", year: 2024, price: 149990, category: "Sedan", engine: "2.0 Flex 16V", power: "177 cv", consumption: "11,5 km/l", weight: "1.370 kg", ipva: 4499, insurance: 4500, maintenance: 2200, features: ["Ar-condicionado dual zone", "Bancos em couro", "Central multimídia 10\"", "Carregador wireless", "Piloto automático", "7 airbags"], main_image: "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=400&q=80"] },
  { id: "sedan-002", name: "Honda Civic", year: 2024, price: 159990, category: "Sedan", engine: "2.0 FlexOne 16V", power: "173 cv", consumption: "11,8 km/l", weight: "1.340 kg", ipva: 4799, insurance: 4800, maintenance: 2100, features: ["Ar-condicionado digital", "Bancos em couro", "Central multimídia", "Honda Sensing", "Câmera 360°", "6 airbags"], main_image: "https://images.unsplash.com/photo-1609521263047-f8f205293f36?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1609521263047-f8f205293f36?auto=format&fit=crop&w=400&q=80"] },
  { id: "sedan-003", name: "Volkswagen Virtus", year: 2024, price: 109990, category: "Sedan", engine: "1.0 TSI Flex 12V", power: "116 cv", consumption: "12,2 km/l", weight: "1.150 kg", ipva: 3299, insurance: 3500, maintenance: 1900, features: ["Ar-condicionado", "Direção elétrica", "Vidros elétricos", "Central multimídia", "Sensor de ré", "Volante multifuncional"], main_image: "https://images.unsplash.com/photo-1594502184342-2e2f1e18e5a4?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1594502184342-2e2f1e18e5a4?auto=format&fit=crop&w=400&q=80"] },
  { id: "suv-001", name: "Jeep Compass", year: 2024, price: 189990, category: "SUV", engine: "1.3 Turbo Flex 16V", power: "185 cv", consumption: "10,5 km/l", weight: "1.520 kg", ipva: 5699, insurance: 5500, maintenance: 2800, features: ["Ar-condicionado dual zone", "Bancos em couro", "Central multimídia 10\"", "Câmera de ré", "Piloto automático", "Seletor de terreno"], main_image: "https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&w=400&q=80"] },
  { id: "suv-002", name: "Toyota Corolla Cross", year: 2024, price: 179990, category: "SUV", engine: "2.0 Flex 16V", power: "177 cv", consumption: "11,0 km/l", weight: "1.440 kg", ipva: 5399, insurance: 5200, maintenance: 2500, features: ["Ar-condicionado digital", "Central multimídia", "Toyota Safety Sense", "Câmera de ré", "Bancos em couro"], main_image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80"] },
  { id: "suv-003", name: "Volkswagen T-Cross", year: 2024, price: 139990, category: "SUV", engine: "1.0 TSI Flex 12V", power: "116 cv", consumption: "11,8 km/l", weight: "1.280 kg", ipva: 4199, insurance: 4000, maintenance: 2200, features: ["Ar-condicionado", "Central multimídia", "Sensor de ré", "Volante multifuncional", "Bank traseiro corrediço"], main_image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=400&q=80"] },
  { id: "picape-001", name: "Toyota Hilux", year: 2024, price: 249990, category: "Picape", engine: "2.8 Turbo Diesel 16V", power: "204 cv", consumption: "9,5 km/l", weight: "2.110 kg", ipva: 7499, insurance: 7500, maintenance: 3500, features: ["Ar-condicionado digital", "Central multimídia", "Câmera de ré", "Seletor de tração 4x4", "Controle de descida"], main_image: "https://images.unsplash.com/photo-1544761634-6e4243d1e62b?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1544761634-6e4243d1e62b?auto=format&fit=crop&w=400&q=80"] },
  { id: "picape-002", name: "Ford Ranger", year: 2024, price: 229990, category: "Picape", engine: "2.0 Turbo Diesel 16V", power: "170 cv", consumption: "9,8 km/l", weight: "2.080 kg", ipva: 6899, insurance: 7000, maintenance: 3200, features: ["Ar-condicionado", "Central multimídia SYNC", "Câmera de ré", "Seletor de tração 4x4", "Controle de estabilidade"], main_image: "https://images.unsplash.com/photo-1509121911074-0e6e9923462f?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1509121911074-0e6e9923462f?auto=format&fit=crop&w=400&q=80"] },
  { id: "picape-003", name: "Fiat Toro", year: 2024, price: 159990, category: "Picape", engine: "1.3 Turbo Flex 16V", power: "185 cv", consumption: "10,2 km/l", weight: "1.560 kg", ipva: 4799, insurance: 4800, maintenance: 2600, features: ["Ar-condicionado", "Central multimídia", "Câmera de ré", "Sensor de estacionamento", "Banco traseiro rebatível"], main_image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80"] },
  { id: "eletrico-001", name: "BYD Dolphin Mini", year: 2024, price: 119990, category: "Eletrico", engine: "Elétrico 109 cv", power: "109 cv", consumption: "0,48 kWh/km", weight: "1.240 kg", ipva: 0, insurance: 3800, maintenance: 900, features: ["Ar-condicionado", "Central multimídia 12\"", "Câmera de ré", "Carregamento DC rápido", "Modo de condução ecológico"], main_image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=400&q=80"] },
  { id: "eletrico-002", name: "Volkswagen ID.4", year: 2024, price: 249990, category: "Eletrico", engine: "Elétrico 204 cv", power: "204 cv", consumption: "0,35 kWh/km", weight: "1.890 kg", ipva: 0, insurance: 6500, maintenance: 1200, features: ["Ar-condicionado digital", "Central multimídia 12\"", "Câmera 360°", "Piloto automático adaptativo", "Bancos em couro"], main_image: "https://images.unsplash.com/photo-1619767886558-efdc7b9af8b3?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1619767886558-efdc7b9af8b3?auto=format&fit=crop&w=400&q=80"] },
  { id: "premium-001", name: "BMW X1", year: 2024, price: 299990, category: "Premium", engine: "2.0 Turbo 16V", power: "192 cv", consumption: "10,8 km/l", weight: "1.550 kg", ipva: 8999, insurance: 8500, maintenance: 4500, features: ["Ar-condicionado digital", "Bancos em couro", "Central multimídia 10\"", "Câmera 360°", "Piloto automático", "Teto solar panorâmico"], main_image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80"] },
  { id: "premium-002", name: "Mercedes-Benz GLC", year: 2024, price: 379990, category: "Premium", engine: "2.0 Turbo 16V", power: "258 cv", consumption: "9,5 km/l", weight: "1.750 kg", ipva: 11399, insurance: 10000, maintenance: 5500, features: ["Ar-condicionado digital", "Bancos em couro", "Central multimídia 12\"", "Câmera 360°", "Piloto automático", "Teto solar panorâmico", "Som Burmester"], main_image: "https://images.unsplash.com/photo-1616422285627-4733a7d5e157?auto=format&fit=crop&w=800&q=80", thumbnail_images: ["https://images.unsplash.com/photo-1616422285627-4733a7d5e157?auto=format&fit=crop&w=400&q=80"] },
];

async function main() {
  for (const car of cars) {
    const { error } = await supabase.from("cars").upsert(
      {
        ...car,
        features: JSON.stringify(car.features),
        thumbnail_images: JSON.stringify(car.thumbnail_images),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error(`Error inserting ${car.id} (${car.name}):`, error.message);
    } else {
      console.log(`✅ ${car.id} — ${car.name}`);
    }
  }

  console.log(`\n✨ Done! ${cars.length} cars inserted/updated.`);
}

main().catch(console.error);
