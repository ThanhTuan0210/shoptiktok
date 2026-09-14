// =======================================================================
// DANH MỤC ĐƠN VỊ HÀNH CHÍNH VIỆT NAM (MÔ HÌNH CHÍNH QUYỀN ĐỊA PHƯƠNG 2 CẤP)
// Chuẩn Nghị quyết số 202/2025/QH15 của Quốc hội (34 Đơn vị hành chính cấp tỉnh)
// TINH GỌN CHÍNH QUYỀN 2 CẤP: BỎ CẤP HUYỆN, CHỈ CÒN CẤP TỈNH VÀ PHƯỜNG / XÃ
// Gồm 6 Thành phố trực thuộc Trung ương & 28 Tỉnh
// =======================================================================

export interface NewProvinceInfo {
  name: string; // Tên tỉnh/thành phố chính thức mới
  shortName: string; // Tên ngắn gọn
  formerProvinces: string[]; // Các tỉnh cũ sáp nhập thành
  isCentralCity: boolean; // Có phải thành phố trực thuộc Trung ương không
  status: 'merged' | 'unchanged';
}

export const NEW_34_PROVINCES: NewProvinceInfo[] = [
  // --- 6 THÀNH PHỐ TRỰC THUỘC TRUNG ƯƠNG ---
  {
    name: "TP. Hà Nội",
    shortName: "Hà Nội",
    formerProvinces: ["Hà Nội"],
    isCentralCity: true,
    status: 'unchanged'
  },
  {
    name: "TP. Hồ Chí Minh (gồm TP.HCM, Bình Dương, Bà Rịa - Vũng Tàu)",
    shortName: "TP. Hồ Chí Minh",
    formerProvinces: ["TP. Hồ Chí Minh", "Bình Dương", "Bà Rịa - Vũng Tàu"],
    isCentralCity: true,
    status: 'merged'
  },
  {
    name: "TP. Hải Phòng (gồm Hải Phòng & Hải Dương)",
    shortName: "TP. Hải Phòng",
    formerProvinces: ["Hải Phòng", "Hải Dương"],
    isCentralCity: true,
    status: 'merged'
  },
  {
    name: "TP. Đà Nẵng (gồm Đà Nẵng & Quảng Nam)",
    shortName: "TP. Đà Nẵng",
    formerProvinces: ["Đà Nẵng", "Quảng Nam"],
    isCentralCity: true,
    status: 'merged'
  },
  {
    name: "TP. Cần Thơ (gồm Cần Thơ, Hậu Giang, Sóc Trăng)",
    shortName: "TP. Cần Thơ",
    formerProvinces: ["Cần Thơ", "Hậu Giang", "Sóc Trăng"],
    isCentralCity: true,
    status: 'merged'
  },
  {
    name: "TP. Huế",
    shortName: "Huế",
    formerProvinces: ["Thừa Thiên Huế"],
    isCentralCity: true,
    status: 'unchanged'
  },

  // --- 28 TỈNH (GỒM 9 TỈNH GIỮ NGUYÊN & 19 TỈNH HỢP NHẤT) ---
  {
    name: "Tỉnh Hưng Yên (gồm Thái Bình & Hưng Yên)",
    shortName: "Hưng Yên",
    formerProvinces: ["Thái Bình", "Hưng Yên"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Ninh Bình (gồm Ninh Bình, Nam Định & Hà Nam)",
    shortName: "Ninh Bình",
    formerProvinces: ["Ninh Bình", "Nam Định", "Hà Nam"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Bắc Ninh (gồm Bắc Ninh & Bắc Giang)",
    shortName: "Bắc Ninh",
    formerProvinces: ["Bắc Ninh", "Bắc Giang"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Phú Thọ (gồm Phú Thọ, Vĩnh Phúc & Hòa Bình)",
    shortName: "Phú Thọ",
    formerProvinces: ["Phú Thọ", "Vĩnh Phúc", "Hòa Bình"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Thái Nguyên (gồm Thái Nguyên & Bắc Kạn)",
    shortName: "Thái Nguyên",
    formerProvinces: ["Thái Nguyên", "Bắc Kạn"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Tuyên Quang (gồm Tuyên Quang & Hà Giang)",
    shortName: "Tuyên Quang",
    formerProvinces: ["Tuyên Quang", "Hà Giang"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Lào Cai (gồm Lào Cai & Yên Bái)",
    shortName: "Lào Cai",
    formerProvinces: ["Lào Cai", "Yên Bái"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Quảng Ninh",
    shortName: "Quảng Ninh",
    formerProvinces: ["Quảng Ninh"],
    isCentralCity: false,
    status: 'unchanged'
  },
  {
    name: "Tỉnh Thanh Hóa",
    shortName: "Thanh Hóa",
    formerProvinces: ["Thanh Hóa"],
    isCentralCity: false,
    status: 'unchanged'
  },
  {
    name: "Tỉnh Nghệ An",
    shortName: "Nghệ An",
    formerProvinces: ["Nghệ An"],
    isCentralCity: false,
    status: 'unchanged'
  },
  {
    name: "Tỉnh Hà Tĩnh",
    shortName: "Hà Tĩnh",
    formerProvinces: ["Hà Tĩnh"],
    isCentralCity: false,
    status: 'unchanged'
  },
  {
    name: "Tỉnh Quảng Trị (gồm Quảng Trị & Quảng Bình)",
    shortName: "Quảng Trị",
    formerProvinces: ["Quảng Trị", "Quảng Bình"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Quảng Ngãi (gồm Quảng Ngãi & Kon Tum)",
    shortName: "Quảng Ngãi",
    formerProvinces: ["Quảng Ngãi", "Kon Tum"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Gia Lai (gồm Gia Lai & Bình Định)",
    shortName: "Gia Lai",
    formerProvinces: ["Gia Lai", "Bình Định"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Khánh Hòa (gồm Khánh Hòa & Ninh Thuận)",
    shortName: "Khánh Hòa",
    formerProvinces: ["Khánh Hòa", "Ninh Thuận"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Lâm Đồng (gồm Lâm Đồng, Bình Thuận & Đắk Nông)",
    shortName: "Lâm Đồng",
    formerProvinces: ["Lâm Đồng", "Bình Thuận", "Đắk Nông"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Đắk Lắk (gồm Đắk Lắk & Phú Yên)",
    shortName: "Đắk Lắk",
    formerProvinces: ["Đắk Lắk", "Phú Yên"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Đồng Nai (gồm Đồng Nai & Bình Phước)",
    shortName: "Đồng Nai",
    formerProvinces: ["Đồng Nai", "Bình Phước"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Tây Ninh (gồm Tây Ninh & Long An)",
    shortName: "Tây Ninh",
    formerProvinces: ["Tây Ninh", "Long An"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Vĩnh Long (gồm Vĩnh Long, Bến Tre & Trà Vinh)",
    shortName: "Vĩnh Long",
    formerProvinces: ["Vĩnh Long", "Bến Tre", "Trà Vinh"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Đồng Tháp (gồm Đồng Tháp & Tiền Giang)",
    shortName: "Đồng Tháp",
    formerProvinces: ["Đồng Tháp", "Tiền Giang"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Cà Mau (gồm Cà Mau & Bạc Liêu)",
    shortName: "Cà Mau",
    formerProvinces: ["Cà Mau", "Bạc Liêu"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh An Giang (gồm An Giang & Kiên Giang)",
    shortName: "An Giang",
    formerProvinces: ["An Giang", "Kiên Giang"],
    isCentralCity: false,
    status: 'merged'
  },
  {
    name: "Tỉnh Cao Bằng",
    shortName: "Cao Bằng",
    formerProvinces: ["Cao Bằng"],
    isCentralCity: false,
    status: 'unchanged'
  },
  {
    name: "Tỉnh Lạng Sơn",
    shortName: "Lạng Sơn",
    formerProvinces: ["Lạng Sơn"],
    isCentralCity: false,
    status: 'unchanged'
  },
  {
    name: "Tỉnh Sơn La",
    shortName: "Sơn La",
    formerProvinces: ["Sơn La"],
    isCentralCity: false,
    status: 'unchanged'
  },
  {
    name: "Tỉnh Điện Biên",
    shortName: "Điện Biên",
    formerProvinces: ["Điện Biên"],
    isCentralCity: false,
    status: 'unchanged'
  },
  {
    name: "Tỉnh Lai Châu",
    shortName: "Lai Châu",
    formerProvinces: ["Lai Châu"],
    isCentralCity: false,
    status: 'unchanged'
  }
];

// Danh sách tra cứu thuận tiện theo tên cũ (hướng dẫn khách hàng về tỉnh mới)
export const FORMER_PROVINCE_FORWARDING: { former: string; targetProvince: string }[] = [
  { former: "Thái Bình", targetProvince: "Tỉnh Hưng Yên (gồm Thái Bình & Hưng Yên)" },
  { former: "Hưng Yên", targetProvince: "Tỉnh Hưng Yên (gồm Thái Bình & Hưng Yên)" },
  { former: "Hải Dương", targetProvince: "TP. Hải Phòng (gồm Hải Phòng & Hải Dương)" },
  { former: "Nam Định", targetProvince: "Tỉnh Ninh Bình (gồm Ninh Bình, Nam Định & Hà Nam)" },
  { former: "Hà Nam", targetProvince: "Tỉnh Ninh Bình (gồm Ninh Bình, Nam Định & Hà Nam)" },
  { former: "Bình Dương", targetProvince: "TP. Hồ Chí Minh (gồm TP.HCM, Bình Dương, Bà Rịa - Vũng Tàu)" },
  { former: "Bà Rịa - Vũng Tàu", targetProvince: "TP. Hồ Chí Minh (gồm TP.HCM, Bình Dương, Bà Rịa - Vũng Tàu)" },
  { former: "Bắc Giang", targetProvince: "Tỉnh Bắc Ninh (gồm Bắc Ninh & Bắc Giang)" },
  { former: "Vĩnh Phúc", targetProvince: "Tỉnh Phú Thọ (gồm Phú Thọ, Vĩnh Phúc & Hòa Bình)" },
  { former: "Hòa Bình", targetProvince: "Tỉnh Phú Thọ (gồm Phú Thọ, Vĩnh Phúc & Hòa Bình)" },
  { former: "Bắc Kạn", targetProvince: "Tỉnh Thái Nguyên (gồm Thái Nguyên & Bắc Kạn)" },
  { former: "Hà Giang", targetProvince: "Tỉnh Tuyên Quang (gồm Tuyên Quang & Hà Giang)" },
  { former: "Yên Bái", targetProvince: "Tỉnh Lào Cai (gồm Lào Cai & Yên Bái)" },
  { former: "Quảng Bình", targetProvince: "Tỉnh Quảng Trị (gồm Quảng Trị & Quảng Bình)" },
  { former: "Quảng Nam", targetProvince: "TP. Đà Nẵng (gồm Đà Nẵng & Quảng Nam)" },
  { former: "Kon Tum", targetProvince: "Tỉnh Quảng Ngãi (gồm Quảng Ngãi & Kon Tum)" },
  { former: "Bình Định", targetProvince: "Tỉnh Gia Lai (gồm Gia Lai & Bình Định)" },
  { former: "Ninh Thuận", targetProvince: "Tỉnh Khánh Hòa (gồm Khánh Hòa & Ninh Thuận)" },
  { former: "Đắk Nông", targetProvince: "Tỉnh Lâm Đồng (gồm Lâm Đồng, Bình Thuận & Đắk Nông)" },
  { former: "Bình Thuận", targetProvince: "Tỉnh Lâm Đồng (gồm Lâm Đồng, Bình Thuận & Đắk Nông)" },
  { former: "Phú Yên", targetProvince: "Tỉnh Đắk Lắk (gồm Đắk Lắk & Phú Yên)" },
  { former: "Bình Phước", targetProvince: "Tỉnh Đồng Nai (gồm Đồng Nai & Bình Phước)" },
  { former: "Long An", targetProvince: "Tỉnh Tây Ninh (gồm Tây Ninh & Long An)" },
  { former: "Bến Tre", targetProvince: "Tỉnh Vĩnh Long (gồm Vĩnh Long, Bến Tre & Trà Vinh)" },
  { former: "Trà Vinh", targetProvince: "Tỉnh Vĩnh Long (gồm Vĩnh Long, Bến Tre & Trà Vinh)" },
  { former: "Tiền Giang", targetProvince: "Tỉnh Đồng Tháp (gồm Đồng Tháp & Tiền Giang)" },
  { former: "Bạc Liêu", targetProvince: "Tỉnh Cà Mau (gồm Cà Mau & Bạc Liêu)" },
  { former: "Kiên Giang", targetProvince: "Tỉnh An Giang (gồm An Giang & Kiên Giang)" },
  { former: "Hậu Giang", targetProvince: "TP. Cần Thơ (gồm Cần Thơ, Hậu Giang, Sóc Trăng)" },
  { former: "Sóc Trăng", targetProvince: "TP. Cần Thơ (gồm Cần Thơ, Hậu Giang, Sóc Trăng)" },
];

/**
 * Hàm chuẩn hóa: Chuyển toàn bộ danh xưng hành chính cũ (Huyện, Quận, Thị xã, TP)
 * sang chuẩn mô hình 2 cấp: chỉ còn PHƯỜNG và XÃ / THỊ TRẤN.
 * 100% không còn chữ "Huyện" trong hệ thống!
 */
export function formatToWardOrCommune(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  // Nếu đã là Phường, Xã hoặc Thị trấn thì giữ nguyên
  if (trimmed.startsWith("Phường ") || trimmed.startsWith("Xã ") || trimmed.startsWith("Thị trấn ")) {
    return trimmed;
  }
  // Bỏ cấp Huyện: "Huyện X" -> "Xã / Thị trấn X"
  if (/^Huyện\s+/i.test(trimmed)) {
    return "Xã / Thị trấn " + trimmed.replace(/^Huyện\s+/i, "");
  }
  // Bỏ cấp Quận: "Quận X" -> "Phường / Đô thị X"
  if (/^Quận\s+/i.test(trimmed)) {
    return "Phường / Đô thị " + trimmed.replace(/^Quận\s+/i, "");
  }
  // "Thị xã X" -> "Phường / Thị trấn X"
  if (/^Thị xã\s+/i.test(trimmed)) {
    return "Phường / Thị trấn " + trimmed.replace(/^Thị xã\s+/i, "");
  }
  // "TP. X" -> "Phường trung tâm X"
  if (/^TP\.\s+/i.test(trimmed)) {
    return "Phường trung tâm " + trimmed.replace(/^TP\.\s+/i, "");
  }
  return trimmed;
}

// BẢN ĐỒ CẤP CƠ SỞ: PHƯỜNG & XÃ / THỊ TRẤN (CHUẨN CHÍNH QUYỀN 2 CẤP)
export const WARD_COMMUNE_MAP_RAW: Record<string, string[]> = {
  // Hà Nội: Phường đô thị & Xã / Thị trấn ngoại thành
  "Hà Nội": [
    "Phường Ba Đình (Điện Biên, Kim Mã, Giảng Võ)",
    "Phường Hoàn Kiếm (Hàng Bạc, Tràng Tiền, Lý Thái Tổ)",
    "Phường Tây Hồ (Quảng An, Thụy Khuê, Nhật Tân)",
    "Phường Cầu Giấy (Dịch Vọng, Nghĩa Tân, Yên Hòa)",
    "Phường Đống Đa (Láng Hạ, Ô Chợ Dừa, Kim Liên)",
    "Phường Hai Bà Trưng (Bách Khoa, Minh Khai, Phố Huế)",
    "Phường Thanh Xuân (Khương Mai, Nhân Chính)",
    "Phường Nam Từ Liêm (Mỹ Đình, Mễ Trì, Trung Văn)",
    "Phường Bắc Từ Liêm (Xuân Đỉnh, Cổ Nhuế)",
    "Phường Hà Đông (Quang Trung, Mộ Lao, Văn Quán)",
    "Phường Long Biên (Bồ Đề, Ngọc Lâm, Gia Thụy)",
    "Phường Hoàng Mai (Hoàng Liệt, Định Công, Tân Mai)",
    "Xã / Thị trấn Đông Anh", "Xã / Thị trấn Gia Lâm", "Xã / Thị trấn Sóc Sơn",
    "Xã / Thị trấn Thanh Trì", "Xã / Thị trấn Mê Linh", "Xã / Thị trấn Hoài Đức",
    "Xã / Thị trấn Đan Phượng", "Xã / Thị trấn Thạch Thất", "Xã / Thị trấn Quốc Oai",
    "Xã / Thị trấn Chương Mỹ", "Xã / Thị trấn Thường Tín", "Xã / Thị trấn Phú Xuyên",
    "Xã / Thị trấn Ba Vì", "Xã / Thị trấn Phúc Thọ", "Xã / Thị trấn Sơn Tây"
  ],

  // TP.HCM: Phường nội thành & Xã / Thị trấn
  "TP. Hồ Chí Minh": [
    "Phường Bến Nghé, Bến Thành (Quận 1 cũ)",
    "Phường Võ Thị Sáu (Quận 3 cũ)",
    "Phường Thảo Điền, An Phú, Thủ Thiêm (TP. Thủ Đức)",
    "Phường Hiệp Phú, Linh Trung, Phước Long (TP. Thủ Đức)",
    "Phường 1, 2, 3 (Quận 4, Quận 5, Quận 6 cũ)",
    "Phường Tân Hưng, Tân Phong (Quận 7 cũ)",
    "Phường 12, 14, 15 (Quận 8, Quận 10, Quận 11 cũ)",
    "Phường Thạnh Xuân, An Phú Đông (Quận 12 cũ)",
    "Phường 1, 2, 3 (Bình Thạnh, Phú Nhuận, Gò Vấp)",
    "Phường Tây Thạnh, Sơn Kỳ (Tân Phú, Tân Bình cũ)",
    "Phường An Lạc, Bình Trị Đông (Bình Tân cũ)",
    "Xã / Thị trấn Củ Chi", "Xã / Thị trấn Hóc Môn",
    "Xã / Thị trấn Bình Chánh", "Xã / Thị trấn Nhà Bè", "Xã / Thị trấn Cần Giờ"
  ],
  "Bình Dương": [
    "Phường Phú Cường, Hiệp Thành (Thủ Dầu Một)",
    "Phường An Phú, Lái Thiêu (Thuận An)",
    "Phường Dĩ An, Đông Hòa (Dĩ An)",
    "Phường Mỹ Phước (Bến Cát)",
    "Phường Uyên Hưng (Tân Uyên)",
    "Xã / Thị trấn Bàu Bàng", "Xã / Thị trấn Bắc Tân Uyên", "Xã / Thị trấn Dầu Tiếng", "Xã / Thị trấn Phú Giáo"
  ],
  "Bà Rịa - Vũng Tàu": [
    "Phường 1, Phường Thắng Tam (Vũng Tàu)",
    "Phường Phước Trung, Phước Hiệp (Bà Rịa)",
    "Phường Phú Mỹ, Tân Phước (Phú Mỹ)",
    "Xã / Thị trấn Châu Đức", "Xã / Thị trấn Xuyên Mộc",
    "Xã / Thị trấn Long Điền", "Xã / Thị trấn Đất Đỏ", "Xã / Thị trấn Côn Đảo"
  ],

  // Hải Phòng & Hải Dương
  "Hải Phòng": [
    "Phường Hồng Bàng", "Phường Ngô Quyền", "Phường Lê Chân", "Phường Hải An", "Phường Kiến An",
    "Phường Đồ Sơn", "Phường Dương Kinh", "Phường Thủy Nguyên",
    "Xã / Thị trấn An Dương", "Xã / Thị trấn An Lão", "Xã / Thị trấn Kiến Thụy",
    "Xã / Thị trấn Tiên Lãng", "Xã / Thị trấn Vĩnh Bảo", "Xã / Thị trấn Cát Hải", "Xã / Thị trấn Bạch Long Vĩ"
  ],
  "Hải Dương": [
    "Phường Trần Phú, Lê Thanh Nghị (Hải Dương)",
    "Phường Sao Đỏ, Chí Minh (Chí Linh)",
    "Phường An Lưu, Hiệp An (Kinh Môn)",
    "Xã / Thị trấn Cẩm Giàng", "Xã / Thị trấn Bình Giang",
    "Xã / Thị trấn Gia Lộc", "Xã / Thị trấn Kim Thành", "Xã / Thị trấn Nam Sách",
    "Xã / Thị trấn Ninh Giang", "Xã / Thị trấn Thanh Hà", "Xã / Thị trấn Thanh Miện", "Xã / Thị trấn Tứ Kỳ"
  ],

  // Đà Nẵng & Quảng Nam
  "Đà Nẵng": [
    "Phường Hải Châu", "Phường Thanh Khê", "Phường Sơn Trà", "Phường Ngũ Hành Sơn",
    "Phường Liên Chiểu", "Phường Cẩm Lệ", "Xã / Thị trấn Hòa Vang", "Khu vực Hoàng Sa"
  ],
  "Quảng Nam": [
    "Phường An Mỹ, Tân Thạnh (Tam Kỳ)",
    "Phường Minh An, Cẩm Châu (Hội An)",
    "Phường Vĩnh Điện, Điện Ngọc (Điện Bàn)",
    "Xã / Thị trấn Duy Xuyên", "Xã / Thị trấn Đại Lộc",
    "Xã / Thị trấn Thăng Bình", "Xã / Thị trấn Núi Thành", "Xã / Thị trấn Phú Ninh", "Xã / Thị trấn Quế Sơn"
  ],

  // Cần Thơ, Hậu Giang, Sóc Trăng
  "Cần Thơ": [
    "Phường Ninh Kiều", "Phường Ô Môn", "Phường Bình Thủy", "Phường Cái Răng", "Phường Thốt Nốt",
    "Xã / Thị trấn Vĩnh Thạnh", "Xã / Thị trấn Cờ Đỏ", "Xã / Thị trấn Phong Điền", "Xã / Thị trấn Thới Lai"
  ],
  "Hậu Giang": [
    "Phường 1, Phường 3 (Vị Thanh)", "Phường Ngã Bảy", "Phường Bình Thạnh (Long Mỹ)",
    "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Châu Thành A", "Xã / Thị trấn Phụng Hiệp", "Xã / Thị trấn Vị Thủy"
  ],
  "Sóc Trăng": [
    "Phường 1, Phường 2 (Sóc Trăng)", "Phường 1 (Ngã Năm)", "Phường 1 (Vĩnh Châu)",
    "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Kế Sách", "Xã / Thị trấn Mỹ Tú", "Xã / Thị trấn Mỹ Xuyên", "Xã / Thị trấn Thạnh Trị", "Xã / Thị trấn Trần Đề"
  ],

  // Huế
  "Thừa Thiên Huế": [
    "Phường Vĩnh Ninh, Phú Nhuận (Huế)", "Phường Phú Hội, Thuận Hòa (Huế)",
    "Phường Phú Bài, Thủy Dương (Hương Thủy)", "Phường Tứ Hạ, Hương Văn (Hương Trà)",
    "Xã / Thị trấn Phong Điền", "Xã / Thị trấn Quảng Điền",
    "Xã / Thị trấn Phú Vang", "Xã / Thị trấn Phú Lộc", "Xã / Thị trấn A Lưới", "Xã / Thị trấn Nam Đông"
  ],

  // TỈNH HƯNG YÊN MỚI (GỒM THÁI BÌNH & HƯNG YÊN) - 100% PHƯỜNG & XÃ / THỊ TRẤN, KHÔNG CÒN CẤP HUYỆN
  "Thái Bình": [
    "Phường Lê Hồng Phong (Thái Bình)",
    "Phường Bồ Xuyên (Thái Bình)",
    "Phường Đề Thám (Thái Bình)",
    "Phường Kỳ Bá (Thái Bình)",
    "Phường Trần Hưng Đạo (Thái Bình)",
    "Phường Tiền Phong (Thái Bình)",
    "Phường Quang Trung (Thái Bình)",
    "Phường Trần Lãm (Thái Bình)",
    "Xã / Thị trấn Đông Hưng",
    "Xã / Thị trấn Hưng Hà",
    "Xã / Thị trấn Kiến Xương",
    "Xã / Thị trấn Quỳnh Phụ",
    "Xã / Thị trấn Thái Thụy (Diêm Điền)",
    "Xã / Thị trấn Tiền Hải",
    "Xã / Thị trấn Vũ Thư"
  ],
  "Hưng Yên": [
    "Phường Hiến Nam (Hưng Yên)",
    "Phường An Tảo (Hưng Yên)",
    "Phường Lam Sơn (Hưng Yên)",
    "Phường Lê Lợi (Hưng Yên)",
    "Phường Minh Khai (Hưng Yên)",
    "Phường Bần Yên Nhân (Mỹ Hào)",
    "Phường Bạch Sam (Mỹ Hào)",
    "Xã / Thị trấn Ân Thi",
    "Xã / Thị trấn Khoái Châu",
    "Xã / Thị trấn Kim Động",
    "Xã / Thị trấn Phù Cừ",
    "Xã / Thị trấn Tiên Lữ",
    "Xã / Thị trấn Văn Giang",
    "Xã / Thị trấn Văn Lâm (Như Quỳnh)",
    "Xã / Thị trấn Yên Mỹ"
  ],

  // Ninh Bình, Nam Định, Hà Nam
  "Ninh Bình": [
    "Phường Đông Thành, Vân Giang (Ninh Bình)", "Phường Trung Sơn, Bắc Sơn (Tam Điệp)",
    "Xã / Thị trấn Gia Viễn", "Xã / Thị trấn Hoa Lư", "Xã / Thị trấn Kim Sơn",
    "Xã / Thị trấn Nho Quan", "Xã / Thị trấn Yên Khánh", "Xã / Thị trấn Yên Mô"
  ],
  "Nam Định": [
    "Phường Vị Hoàng, Trần Tế Xương (Nam Định)", "Phường Năng Tĩnh, Cửa Bắc (Nam Định)",
    "Xã / Thị trấn Giao Thủy", "Xã / Thị trấn Hải Hậu", "Xã / Thị trấn Mỹ Lộc", "Xã / Thị trấn Nam Trực",
    "Xã / Thị trấn Nghĩa Hưng", "Xã / Thị trấn Trực Ninh", "Xã / Thị trấn Vụ Bản", "Xã / Thị trấn Xuân Trường", "Xã / Thị trấn Ý Yên"
  ],
  "Hà Nam": [
    "Phường Minh Khai, Hai Bà Trưng (Phủ Lý)", "Phường Đồng Văn, Hòa Mạc (Duy Tiên)",
    "Xã / Thị trấn Bình Lục", "Xã / Thị trấn Kim Bảng", "Xã / Thị trấn Lý Nhân", "Xã / Thị trấn Thanh Liêm"
  ],

  // Bắc Ninh & Bắc Giang
  "Bắc Ninh": [
    "Phường Suối Hoa, Ninh Xá (Bắc Ninh)", "Phường Đông Ngàn, Đồng Nguyên (Từ Sơn)",
    "Phường Phố Mới (Quế Võ)", "Phường Hồ (Thuận Thành)",
    "Xã / Thị trấn Yên Phong", "Xã / Thị trấn Tiên Du", "Xã / Thị trấn Gia Bình", "Xã / Thị trấn Lương Tài"
  ],
  "Bắc Giang": [
    "Phường Ngô Quyền, Lê Lợi (Bắc Giang)", "Phường Bích Động, Nếnh (Việt Yên)",
    "Xã / Thị trấn Hiệp Hòa", "Xã / Thị trấn Lạng Giang",
    "Xã / Thị trấn Lục Nam", "Xã / Thị trấn Lục Ngạn", "Xã / Thị trấn Tân Yên", "Xã / Thị trấn Yên Dũng"
  ],

  // Phú Thọ, Vĩnh Phúc, Hòa Bình
  "Phú Thọ": [
    "Phường Gia Cẩm, Tiên Cát (Việt Trì)", "Phường Âu Cơ, Hùng Vương (Phú Thọ)",
    "Xã / Thị trấn Cẩm Khê", "Xã / Thị trấn Đoan Hùng", "Xã / Thị trấn Hạ Hòa",
    "Xã / Thị trấn Lâm Thao", "Xã / Thị trấn Phù Ninh", "Xã / Thị trấn Tam Nông", "Xã / Thị trấn Thanh Ba", "Xã / Thị trấn Thanh Sơn"
  ],
  "Vĩnh Phúc": [
    "Phường Tích Sơn, Đống Đa (Vĩnh Yên)", "Phường Trưng Trắc, Hùng Vương (Phúc Yên)",
    "Xã / Thị trấn Bình Xuyên", "Xã / Thị trấn Lập Thạch", "Xã / Thị trấn Tam Dương",
    "Xã / Thị trấn Tam Đảo", "Xã / Thị trấn Vĩnh Tường", "Xã / Thị trấn Yên Lạc"
  ],
  "Hòa Bình": [
    "Phường Phương Lâm, Đồng Tiến (Hòa Bình)",
    "Xã / Thị trấn Cao Phong", "Xã / Thị trấn Đà Bắc", "Xã / Thị trấn Kim Bôi", "Xã / Thị trấn Lương Sơn",
    "Xã / Thị trấn Mai Châu", "Xã / Thị trấn Tân Lạc", "Xã / Thị trấn Lạc Sơn"
  ],

  // Thái Nguyên & Bắc Kạn
  "Thái Nguyên": [
    "Phường Phan Đình Phùng, Trưng Vương (Thái Nguyên)", "Phường Thắng Lợi (Sông Công)", "Phường Ba Hàng (Phổ Yên)",
    "Xã / Thị trấn Đại Từ", "Xã / Thị trấn Định Hóa", "Xã / Thị trấn Đồng Hỷ", "Xã / Thị trấn Phú Bình", "Xã / Thị trấn Phú Lương", "Xã / Thị trấn Võ Nhai"
  ],
  "Bắc Kạn": [
    "Phường Đức Xuân, Phùng Chí Kiên (Bắc Kạn)",
    "Xã / Thị trấn Ba Bể", "Xã / Thị trấn Bạch Thông", "Xã / Thị trấn Chợ Đồn", "Xã / Thị trấn Chợ Mới", "Xã / Thị trấn Na Rì"
  ],

  // Tuyên Quang & Hà Giang
  "Tuyên Quang": [
    "Phường Tân Quang, Minh Xuân (Tuyên Quang)",
    "Xã / Thị trấn Chiêm Hóa", "Xã / Thị trấn Hàm Yên", "Xã / Thị trấn Lâm Bình", "Xã / Thị trấn Na Hang", "Xã / Thị trấn Sơn Dương", "Xã / Thị trấn Yên Sơn"
  ],
  "Hà Giang": [
    "Phường Trần Phú, Nguyễn Trãi (Hà Giang)",
    "Xã / Thị trấn Bắc Quang", "Xã / Thị trấn Đồng Văn", "Xã / Thị trấn Hoàng Su Phì", "Xã / Thị trấn Mèo Vạc", "Xã / Thị trấn Quản Bạ", "Xã / Thị trấn Vị Xuyên"
  ],

  // Lào Cai & Yên Bái
  "Lào Cai": [
    "Phường Cốc Lếu, Kim Tân (Lào Cai)", "Phường Sa Pa (Sa Pa)",
    "Xã / Thị trấn Bát Xát", "Xã / Thị trấn Bảo Thắng", "Xã / Thị trấn Bảo Yên", "Xã / Thị trấn Bắc Hà", "Xã / Thị trấn Mường Khương", "Xã / Thị trấn Văn Bàn"
  ],
  "Yên Bái": [
    "Phường Yên Ninh, Đồng Tâm (Yên Bái)", "Phường Trung Tâm (Nghĩa Lộ)",
    "Xã / Thị trấn Lục Yên", "Xã / Thị trấn Mù Căng Chải", "Xã / Thị trấn Trấn Yên", "Xã / Thị trấn Văn Chấn", "Xã / Thị trấn Yên Bình"
  ],

  // Quảng Trị & Quảng Bình
  "Quảng Trị": [
    "Phường 1, Phường 2 (Đông Hà)", "Phường 1, Phường 2 (Quảng Trị)",
    "Xã / Thị trấn Cam Lộ", "Xã / Thị trấn Cồn Cỏ", "Xã / Thị trấn Đakrông", "Xã / Thị trấn Gio Linh", "Xã / Thị trấn Hướng Hóa", "Xã / Thị trấn Hải Lăng", "Xã / Thị trấn Triệu Phong", "Xã / Thị trấn Vĩnh Linh"
  ],
  "Quảng Bình": [
    "Phường Đồng Hải, Hải Đình (Đồng Hới)", "Phường Ba Đồn",
    "Xã / Thị trấn Bố Trạch", "Xã / Thị trấn Lệ Thủy", "Xã / Thị trấn Minh Hóa", "Xã / Thị trấn Quảng Ninh", "Xã / Thị trấn Quảng Trạch", "Xã / Thị trấn Tuyên Hóa"
  ],

  // Quảng Ngãi & Kon Tum
  "Quảng Ngãi": [
    "Phường Trần Hưng Đạo, Lê Hồng Phong (Quảng Ngãi)", "Phường Nguyễn Nghiêm (Đức Phổ)",
    "Xã / Thị trấn Bình Sơn", "Xã / Thị trấn Lý Sơn", "Xã / Thị trấn Mộ Đức", "Xã / Thị trấn Nghĩa Hành", "Xã / Thị trấn Sơn Tịnh", "Xã / Thị trấn Tư Nghĩa"
  ],
  "Kon Tum": [
    "Phường Quang Trung, Quyết Thắng (Kon Tum)",
    "Xã / Thị trấn Đắk Glei", "Xã / Thị trấn Đắk Hà", "Xã / Thị trấn Đắk Tô", "Xã / Thị trấn Kon Plông", "Xã / Thị trấn Ngọc Hồi", "Xã / Thị trấn Sa Thầy"
  ],

  // Gia Lai & Bình Định
  "Gia Lai": [
    "Phường Diên Hồng, Hoa Lư (Pleiku)", "Phường An Bình (An Khê)", "Phường Đoàn Kết (Ayun Pa)",
    "Xã / Thị trấn Chư Păh", "Xã / Thị trấn Chư Prông", "Xã / Thị trấn Chư Sê", "Xã / Thị trấn Đak Đoa", "Xã / Thị trấn Đức Cơ"
  ],
  "Bình Định": [
    "Phường Lê Lợi, Trần Hưng Đạo (Quy Nhơn)", "Phường Bình Định (An Nhơn)", "Phường Bồng Sơn (Hoài Nhơn)",
    "Xã / Thị trấn Phù Cát", "Xã / Thị trấn Phù Mỹ", "Xã / Thị trấn Tuy Phước", "Xã / Thị trấn Tây Sơn"
  ],

  // Khánh Hòa & Ninh Thuận
  "Khánh Hòa": [
    "Phường Lộc Thọ, Vĩnh Hải (Nha Trang)", "Phường Cam Lộc (Cam Ranh)", "Phường Ninh Hiệp (Ninh Hòa)",
    "Xã / Thị trấn Vạn Ninh", "Xã / Thị trấn Diên Khánh", "Xã / Thị trấn Cam Lâm", "Xã / Thị trấn Trường Sa"
  ],
  "Ninh Thuận": [
    "Phường Kinh Dinh, Phước Mỹ (Phan Rang - Tháp Chàm)",
    "Xã / Thị trấn Ninh Hải", "Xã / Thị trấn Ninh Phước", "Xã / Thị trấn Ninh Sơn", "Xã / Thị trấn Thuận Bắc", "Xã / Thị trấn Thuận Nam"
  ],

  // Lâm Đồng, Bình Thuận, Đắk Nông
  "Lâm Đồng": [
    "Phường 1, Phường 2, Phường 10 (Đà Lạt)", "Phường 1, B'Lao (Bảo Lộc)",
    "Xã / Thị trấn Đức Trọng", "Xã / Thị trấn Đơn Dương", "Xã / Thị trấn Lạc Dương", "Xã / Thị trấn Di Linh", "Xã / Thị trấn Bảo Lâm", "Xã / Thị trấn Đạ Huoai"
  ],
  "Bình Thuận": [
    "Phường Phú Thủy, Đức Nghĩa (Phan Thiết)", "Phường Tân An, Phước Hội (La Gi)",
    "Xã / Thị trấn Tuy Phong", "Xã / Thị trấn Bắc Bình", "Xã / Thị trấn Hàm Thuận Bắc", "Xã / Thị trấn Hàm Thuận Nam", "Xã / Thị trấn Hàm Tân", "Xã / Thị trấn Tánh Linh", "Xã / Thị trấn Đức Linh", "Xã / Thị trấn Phú Quý"
  ],
  "Đắk Nông": [
    "Phường Nghĩa Đức, Nghĩa Phú (Gia Nghĩa)",
    "Xã / Thị trấn Đắk R'lấp", "Xã / Thị trấn Đắk Mil", "Xã / Thị trấn Cư Jút", "Xã / Thị trấn Đắk Song", "Xã / Thị trấn Krông Nô", "Xã / Thị trấn Tuy Đức"
  ],

  // Đắk Lắk & Phú Yên
  "Đắk Lắk": [
    "Phường Tân An, Thắng Lợi (Buôn Ma Thuột)", "Phường An Lạc (Buôn Hồ)",
    "Xã / Thị trấn Ea Kar", "Xã / Thị trấn Krông Pắc", "Xã / Thị trấn Cư M'gar", "Xã / Thị trấn Ea H'leo", "Xã / Thị trấn Krông Ana"
  ],
  "Phú Yên": [
    "Phường 1, Phường 2 (Tuy Hòa)", "Phường Xuân Phú (Sông Cầu)", "Phường Hòa Vinh (Đông Hòa)",
    "Xã / Thị trấn Đồng Xuân", "Xã / Thị trấn Sông Hinh", "Xã / Thị trấn Sơn Hòa", "Xã / Thị trấn Phú Hòa", "Xã / Thị trấn Tây Hòa", "Xã / Thị trấn Tuy An"
  ],

  // Đồng Nai & Bình Phước
  "Đồng Nai": [
    "Phường Quyết Thắng, Tân Tiến (Biên Hòa)", "Phường Xuân An (Long Khánh)",
    "Xã / Thị trấn Long Thành", "Xã / Thị trấn Nhơn Trạch", "Xã / Thị trấn Trảng Bom", "Xã / Thị trấn Thống Nhất", "Xã / Thị trấn Vĩnh Cửu", "Xã / Thị trấn Định Quán", "Xã / Thị trấn Tân Phú", "Xã / Thị trấn Xuân Lộc", "Xã / Thị trấn Cẩm Mỹ"
  ],
  "Bình Phước": [
    "Phường Tân Phú (Đồng Xoài)", "Phường Hưng Chiến (Bình Long)", "Phường Long Thủy (Phước Long)",
    "Xã / Thị trấn Chơn Thành", "Xã / Thị trấn Đồng Phú", "Xã / Thị trấn Bù Đăng", "Xã / Thị trấn Bù Đốp", "Xã / Thị trấn Bù Gia Mập", "Xã / Thị trấn Lộc Ninh"
  ],

  // Tây Ninh & Long An
  "Tây Ninh": [
    "Phường 1, Phường 3 (Tây Ninh)", "Phường Trảng Bàng", "Phường Long Hoa (Hòa Thành)",
    "Xã / Thị trấn Bến Cầu", "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Dương Minh Châu", "Xã / Thị trấn Gò Dầu", "Xã / Thị trấn Tân Biên", "Xã / Thị trấn Tân Châu"
  ],
  "Long An": [
    "Phường 1, Phường 2 (Tân An)", "Phường Kiến Tường",
    "Xã / Thị trấn Bến Lức", "Xã / Thị trấn Cần Đước", "Xã / Thị trấn Cần Giuộc", "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Đức Hòa", "Xã / Thị trấn Đức Huệ", "Xã / Thị trấn Mộc Hóa", "Xã / Thị trấn Tân Hưng", "Xã / Thị trấn Tân Thạnh", "Xã / Thị trấn Tân Trụ", "Xã / Thị trấn Thạnh Hóa", "Xã / Thị trấn Thủ Thừa", "Xã / Thị trấn Vĩnh Hưng"
  ],

  // Vĩnh Long, Bến Tre, Trà Vinh
  "Vĩnh Long": [
    "Phường 1, Phường 2 (Vĩnh Long)", "Phường Cái Vồn (Bình Minh)",
    "Xã / Thị trấn Bình Tân", "Xã / Thị trấn Long Hồ", "Xã / Thị trấn Mang Thít", "Xã / Thị trấn Tam Bình", "Xã / Thị trấn Trà Ôn", "Xã / Thị trấn Vũng Liêm"
  ],
  "Bến Tre": [
    "Phường An Hội, Phường 4 (Bến Tre)",
    "Xã / Thị trấn Ba Tri", "Xã / Thị trấn Bình Đại", "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Chợ Lách", "Xã / Thị trấn Giồng Trôm", "Xã / Thị trấn Mỏ Cày Bắc", "Xã / Thị trấn Mỏ Cày Nam", "Xã / Thị trấn Thạnh Phú"
  ],
  "Trà Vinh": [
    "Phường 1, Phường 3 (Trà Vinh)", "Phường 1 (Duyên Hải)",
    "Xã / Thị trấn Càng Long", "Xã / Thị trấn Cầu Kè", "Xã / Thị trấn Cầu Ngang", "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Duyên Hải", "Xã / Thị trấn Tiểu Cần", "Xã / Thị trấn Trà Cú"
  ],

  // Đồng Tháp & Tiền Giang
  "Đồng Tháp": [
    "Phường 1, Phường 2 (Cao Lãnh)", "Phường An Thạnh (Hồng Ngự)", "Phường 1 (Sa Đéc)",
    "Xã / Thị trấn Cao Lãnh", "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Hồng Ngự", "Xã / Thị trấn Lai Vung", "Xã / Thị trấn Lấp Vò", "Xã / Thị trấn Tam Nông", "Xã / Thị trấn Tân Hồng", "Xã / Thị trấn Thanh Bình", "Xã / Thị trấn Tháp Mười"
  ],
  "Tiền Giang": [
    "Phường 1, Phường 2 (Mỹ Tho)", "Phường 1 (Gò Công)", "Phường 1 (Cai Lậy)",
    "Xã / Thị trấn Cái Bè", "Xã / Thị trấn Cai Lậy", "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Chợ Gạo", "Xã / Thị trấn Gò Công Đông", "Xã / Thị trấn Gò Công Tây", "Xã / Thị trấn Tân Phú Đông", "Xã / Thị trấn Tân Phước"
  ],

  // Cà Mau & Bạc Liêu
  "Cà Mau": [
    "Phường 1, Phường 2, Phường 5 (Cà Mau)",
    "Xã / Thị trấn Đầm Dơi", "Xã / Thị trấn Cái Nước", "Xã / Thị trấn Trần Văn Thời", "Xã / Thị trấn Thới Bình", "Xã / Thị trấn Năm Căn", "Xã / Thị trấn Ngọc Hiển", "Xã / Thị trấn U Minh", "Xã / Thị trấn Phú Tân"
  ],
  "Bạc Liêu": [
    "Phường 1, Phường 3 (Bạc Liêu)", "Phường 1 (Giá Rai)",
    "Xã / Thị trấn Đông Hải", "Xã / Thị trấn Hòa Bình", "Xã / Thị trấn Phước Long", "Xã / Thị trấn Vĩnh Lợi", "Xã / Thị trấn Hồng Dân"
  ],

  // An Giang & Kiên Giang
  "An Giang": [
    "Phường Mỹ Long, Mỹ Bình (Long Xuyên)", "Phường Châu Phú A (Châu Đốc)", "Phường Long Thạnh (Tân Châu)", "Phường Chi Lăng (Tịnh Biên)",
    "Xã / Thị trấn An Phú", "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Chợ Mới", "Xã / Thị trấn Thoại Sơn", "Xã / Thị trấn Tri Tôn", "Xã / Thị trấn Phú Tân"
  ],
  "Kiên Giang": [
    "Phường Vĩnh Thanh Vân (Rạch Giá)", "Phường Đông Hồ (Hà Tiên)", "Phường Dương Đông, An Thới (Phú Quốc)",
    "Xã / Thị trấn An Biên", "Xã / Thị trấn Hòn Đất", "Xã / Thị trấn Kiên Lương", "Xã / Thị trấn Tân Hiệp", "Xã / Thị trấn Châu Thành", "Xã / Thị trấn Giồng Riềng", "Xã / Thị trấn Gò Quao", "Xã / Thị trấn U Minh Thượng", "Xã / Thị trấn Kiên Hải"
  ],

  // Tỉnh giữ nguyên
  "Quảng Ninh": [
    "Phường Bạch Đằng, Bãi Cháy (Hạ Long)", "Phường Trần Phú, Ka Long (Móng Cái)", "Phường Cẩm Trung (Cẩm Phả)", "Phường Quang Trung (Uông Bí)",
    "Phường Quảng Yên", "Phường Đông Triều", "Xã / Thị trấn Vân Đồn", "Xã / Thị trấn Cô Tô", "Xã / Thị trấn Tiên Yên", "Xã / Thị trấn Đầm Hà", "Xã / Thị trấn Ba Chẽ", "Xã / Thị trấn Bình Liêu"
  ],
  "Thanh Hóa": [
    "Phường Điện Biên, Ba Đình (Thanh Hóa)", "Phường Bắc Sơn (Sầm Sơn)", "Phường Ba Đình (Bỉm Sơn)", "Phường Hải Hòa (Nghi Sơn)",
    "Xã / Thị trấn Hoằng Hóa", "Xã / Thị trấn Hậu Lộc", "Xã / Thị trấn Nga Sơn", "Xã / Thị trấn Quảng Xương", "Xã / Thị trấn Nông Cống", "Xã / Thị trấn Triệu Sơn", "Xã / Thị trấn Thọ Xuân", "Xã / Thị trấn Yên Định", "Xã / Thị trấn Vĩnh Lộc", "Xã / Thị trấn Cẩm Thủy", "Xã / Thị trấn Ngọc Lặc"
  ],
  "Nghệ An": [
    "Phường Lê Mao, Quang Trung (Vinh)", "Phường Nghi Hương (Cửa Lò)", "Phường Hòa Hiếu (Thái Hòa)", "Phường Quỳnh Phương (Hoàng Mai)",
    "Xã / Thị trấn Diễn Châu", "Xã / Thị trấn Quỳnh Lưu", "Xã / Thị trấn Nghi Lộc", "Xã / Thị trấn Nam Đàn", "Xã / Thị trấn Hưng Nguyên", "Xã / Thị trấn Đô Lương", "Xã / Thị trấn Thanh Chương", "Xã / Thị trấn Yên Thành", "Xã / Thị trấn Anh Sơn", "Xã / Thị trấn Con Cuông"
  ],
  "Hà Tĩnh": [
    "Phường Bắc Hà, Nam Hà (Hà Tĩnh)", "Phường Bắc Hồng (Hồng Lĩnh)", "Phường Sông Trí (Kỳ Anh)",
    "Xã / Thị trấn Cẩm Xuyên", "Xã / Thị trấn Can Lộc", "Xã / Thị trấn Nghi Xuân", "Xã / Thị trấn Thạch Hà", "Xã / Thị trấn Đức Thọ", "Xã / Thị trấn Hương Khê", "Xã / Thị trấn Hương Sơn", "Xã / Thị trấn Lộc Hà", "Xã / Thị trấn Vũ Quang"
  ],
  "Cao Bằng": [
    "Phường Hợp Giang, Sông Hiến (Cao Bằng)",
    "Xã / Thị trấn Bảo Lạc", "Xã / Thị trấn Trùng Khánh", "Xã / Thị trấn Quảng Hòa", "Xã / Thị trấn Hà Quảng", "Xã / Thị trấn Hòa An", "Xã / Thị trấn Nguyên Bình", "Xã / Thị trấn Thạch An", "Xã / Thị trấn Bảo Lâm"
  ],
  "Lạng Sơn": [
    "Phường Hoàng Văn Thụ, Vĩnh Trại (Lạng Sơn)",
    "Xã / Thị trấn Cao Lộc", "Xã / Thị trấn Chi Lăng", "Xã / Thị trấn Hữu Lũng", "Xã / Thị trấn Lộc Bình", "Xã / Thị trấn Văn Lãng", "Xã / Thị trấn Bắc Sơn", "Xã / Thị trấn Bình Gia", "Xã / Thị trấn Đình Lập", "Xã / Thị trấn Tràng Định"
  ],
  "Sơn La": [
    "Phường Chiềng Lề, Tô Hiệu (Sơn La)", "Phường Mộc Châu (Mộc Châu)",
    "Xã / Thị trấn Mai Sơn", "Xã / Thị trấn Thuận Châu", "Xã / Thị trấn Mường La", "Xã / Thị trấn Sông Mã", "Xã / Thị trấn Yên Châu", "Xã / Thị trấn Phù Yên", "Xã / Thị trấn Bắc Yên", "Xã / Thị trấn Quỳnh Nhai", "Xã / Thị trấn Sốp Cộp"
  ],
  "Điện Biên": [
    "Phường Mường Thanh, Thanh Bình (Điện Biên Phủ)", "Phường Sông Đà (Mường Lay)",
    "Xã / Thị trấn Điện Biên", "Xã / Thị trấn Tuần Giáo", "Xã / Thị trấn Mường Chà", "Xã / Thị trấn Tủa Chùa", "Xã / Thị trấn Điện Biên Đông", "Xã / Thị trấn Mường Nhé", "Xã / Thị trấn Nậm Pồ"
  ],
  "Lai Châu": [
    "Phường Tân Phong, Đoàn Kết (Lai Châu)",
    "Xã / Thị trấn Phong Thổ", "Xã / Thị trấn Tam Đường", "Xã / Thị trấn Tân Uyên", "Xã / Thị trấn Than Uyên", "Xã / Thị trấn Mường Tè", "Xã / Thị trấn Nậm Nhùn", "Xã / Thị trấn Sìn Hồ"
  ]
};

// Export alias để tương thích ngược 100% với code cũ
export const DISTRICT_MAP_RAW = WARD_COMMUNE_MAP_RAW;

/**
 * Lấy danh sách Phường / Xã / Thị trấn dựa trên Tỉnh/Thành phố được chọn.
 * Áp dụng mô hình chính quyền địa phương 2 cấp: BỎ CẤP HUYỆN, CHỈ CÒN PHƯỜNG & XÃ.
 */
export function getDistrictsByProvince(provinceName: string): string[] {
  if (!provinceName) return [];

  let list: string[] = [];

  // 1. Tìm trong NEW_34_PROVINCES
  const matchedNew = NEW_34_PROVINCES.find(
    p => p.name === provinceName || p.shortName === provinceName || provinceName.startsWith(p.shortName)
  );

  if (matchedNew) {
    for (const f of matchedNew.formerProvinces) {
      if (WARD_COMMUNE_MAP_RAW[f]) {
        list.push(...WARD_COMMUNE_MAP_RAW[f]);
      }
    }
  }

  // 2. Tìm theo tên trực tiếp
  if (list.length === 0 && WARD_COMMUNE_MAP_RAW[provinceName]) {
    list = WARD_COMMUNE_MAP_RAW[provinceName];
  }

  // 3. Loose search
  if (list.length === 0) {
    for (const [k, v] of Object.entries(WARD_COMMUNE_MAP_RAW)) {
      if (provinceName.includes(k) || k.includes(provinceName)) {
        list = v;
        break;
      }
    }
  }

  if (list.length > 0) {
    // Luôn chuẩn hóa: 100% không còn chữ "Huyện"
    const formatted = list.map(formatToWardOrCommune);
    return Array.from(new Set(formatted));
  }

  return [
    "Phường trung tâm / Khu đô thị",
    "Xã / Thị trấn khu vực 1",
    "Xã / Thị trấn khu vực 2",
    "Phường / Xã khác"
  ];
}

// Alias cho ngữ nghĩa mới: getWardsByProvince
export const getWardsByProvince = getDistrictsByProvince;
