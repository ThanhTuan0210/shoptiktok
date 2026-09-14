// =======================================================================
// DANH MỤC ĐƠN VỊ HÀNH CHÍNH VIỆT NAM MỚI NHẤT
// Chuẩn Nghị quyết số 202/2025/QH15 của Quốc hội (Hiệu lực & vận hành từ 2025)
// Cả nước tinh gọn từ 63 tỉnh thành xuống còn 34 ĐƠN VỊ HÀNH CHÍNH CẤP TỈNH
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

export const DISTRICT_MAP_RAW: Record<string, string[]> = {
  // Hà Nội
  "Hà Nội": [
    "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy",
    "Quận Đống Đa", "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Quận Sóc Sơn",
    "Huyện Đông Anh", "Huyện Gia Lâm", "Quận Nam Từ Liêm", "Huyện Thanh Trì", "Quận Bắc Từ Liêm",
    "Huyện Mê Linh", "Quận Hà Đông", "Thị xã Sơn Tây", "Huyện Ba Vì", "Huyện Phúc Thọ",
    "Huyện Đan Phượng", "Huyện Hoài Đức", "Huyện Quốc Oai", "Huyện Thạch Thất", "Huyện Chương Mỹ",
    "Huyện Thanh Oai", "Huyện Thường Tín", "Huyện Phú Xuyên", "Huyện Ứng Hòa", "Huyện Mỹ Đức"
  ],
  // TP.HCM
  "TP. Hồ Chí Minh": [
    "TP. Thủ Đức", "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8",
    "Quận 10", "Quận 11", "Quận 12", "Quận Bình Thạnh", "Quận Gò Vấp", "Quận Phú Nhuận",
    "Quận Tân Bình", "Quận Tân Phú", "Quận Bình Tân", "Huyện Củ Chi", "Huyện Hóc Môn",
    "Huyện Bình Chánh", "Huyện Nhà Bè", "Huyện Cần Giờ"
  ],
  "Bình Dương": [
    "TP. Thủ Dầu Một", "TP. Thuận An", "TP. Dĩ An", "TP. Tân Uyên", "TP. Bến Cát",
    "Huyện Bàu Bàng", "Huyện Bắc Tân Uyên", "Huyện Dầu Tiếng", "Huyện Phú Giáo"
  ],
  "Bà Rịa - Vũng Tàu": [
    "TP. Vũng Tàu", "TP. Bà Rịa", "Thị xã Phú Mỹ", "Huyện Châu Đức", "Huyện Xuyên Mộc",
    "Huyện Long Điền", "Huyện Đất Đỏ", "Huyện Côn Đảo"
  ],
  // Hải Phòng & Hải Dương
  "Hải Phòng": [
    "Quận Hồng Bàng", "Quận Ngô Quyền", "Quận Lê Chân", "Quận Hải An", "Quận Kiến An",
    "Quận Đồ Sơn", "Quận Dương Kinh", "Thành phố Thủy Nguyên", "Huyện An Dương",
    "Huyện An Lão", "Huyện Kiến Thụy", "Huyện Tiên Lãng", "Huyện Vĩnh Bảo", "Huyện Cát Hải", "Huyện Bạch Long Vĩ"
  ],
  "Hải Dương": [
    "TP. Hải Dương", "TP. Chí Linh", "Thị xã Kinh Môn", "Huyện Cẩm Giàng", "Huyện Bình Giang",
    "Huyện Gia Lộc", "Huyện Kim Thành", "Huyện Nam Sách", "Huyện Ninh Giang", "Huyện Thanh Hà",
    "Huyện Thanh Miện", "Huyện Tứ Kỳ"
  ],
  // Đà Nẵng & Quảng Nam
  "Đà Nẵng": [
    "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn",
    "Quận Liên Chiểu", "Quận Cẩm Lệ", "Huyện Hòa Vang", "Huyện Hoàng Sa"
  ],
  "Quảng Nam": [
    "TP. Tam Kỳ", "TP. Hội An", "Thị xã Điện Bàn", "Huyện Duy Xuyên", "Huyện Đại Lộc",
    "Huyện Thăng Bình", "Huyện Núi Thành", "Huyện Phú Ninh", "Huyện Quế Sơn"
  ],
  // Cần Thơ, Hậu Giang, Sóc Trăng
  "Cần Thơ": [
    "Quận Ninh Kiều", "Quận Ô Môn", "Quận Bình Thủy", "Quận Cái Răng", "Quận Thốt Nốt",
    "Huyện Vĩnh Thạnh", "Huyện Cờ Đỏ", "Huyện Phong Điền", "Huyện Thới Lai"
  ],
  "Hậu Giang": [
    "TP. Vị Thanh", "TP. Ngã Bảy", "Thị xã Long Mỹ", "Huyện Châu Thành", "Huyện Châu Thành A",
    "Huyện Phụng Hiệp", "Huyện Vị Thủy"
  ],
  "Sóc Trăng": [
    "TP. Sóc Trăng", "Thị xã Ngã Năm", "Thị xã Vĩnh Châu", "Huyện Châu Thành", "Huyện Kế Sách",
    "Huyện Mỹ Tú", "Huyện Mỹ Xuyên", "Huyện Thạnh Trị", "Huyện Trần Đề"
  ],
  // Huế
  "Thừa Thiên Huế": [
    "TP. Huế", "Thị xã Hương Thủy", "Thị xã Hương Trà", "Huyện Phong Điền", "Huyện Quảng Điền",
    "Huyện Phú Vang", "Huyện Phú Lộc", "Huyện A Lưới", "Huyện Nam Đông"
  ],
  // Thái Bình & Hưng Yên
  "Thái Bình": [
    "TP. Thái Bình", "Huyện Đông Hưng", "Huyện Hưng Hà", "Huyện Kiến Xương",
    "Huyện Quỳnh Phụ", "Huyện Thái Thụy", "Huyện Tiền Hải", "Huyện Vũ Thư"
  ],
  "Hưng Yên": [
    "TP. Hưng Yên", "Thị xã Mỹ Hào", "Huyện Ân Thi", "Huyện Khoái Châu", "Huyện Kim Động",
    "Huyện Phù Cừ", "Huyện Tiên Lữ", "Huyện Văn Giang", "Huyện Văn Lâm", "Huyện Yên Mỹ"
  ],
  // Ninh Bình, Nam Định, Hà Nam
  "Ninh Bình": [
    "TP. Ninh Bình", "TP. Tam Điệp", "Huyện Gia Viễn", "Huyện Hoa Lư", "Huyện Kim Sơn",
    "Huyện Nho Quan", "Huyện Yên Khánh", "Huyện Yên Mô"
  ],
  "Nam Định": [
    "TP. Nam Định", "Huyện Giao Thủy", "Huyện Hải Hậu", "Huyện Mỹ Lộc", "Huyện Nam Trực",
    "Huyện Nghĩa Hưng", "Huyện Trực Ninh", "Huyện Vụ Bản", "Huyện Xuân Trường", "Huyện Ý Yên"
  ],
  "Hà Nam": [
    "TP. Phủ Lý", "Thị xã Duy Tiên", "Huyện Bình Lục", "Huyện Kim Bảng", "Huyện Lý Nhân", "Huyện Thanh Liêm"
  ],
  // Bắc Ninh & Bắc Giang
  "Bắc Ninh": [
    "TP. Bắc Ninh", "TP. Từ Sơn", "Thị xã Quế Võ", "Thị xã Thuận Thành",
    "Huyện Yên Phong", "Huyện Tiên Du", "Huyện Gia Bình", "Huyện Lương Tài"
  ],
  "Bắc Giang": [
    "TP. Bắc Giang", "Thị xã Việt Yên", "Huyện Hiệp Hòa", "Huyện Lạng Giang",
    "Huyện Lục Nam", "Huyện Lục Ngạn", "Huyện Tân Yên", "Huyện Yên Dũng"
  ],
  // Phú Thọ, Vĩnh Phúc, Hòa Bình
  "Phú Thọ": [
    "TP. Việt Trì", "Thị xã Phú Thọ", "Huyện Cẩm Khê", "Huyện Đoan Hùng", "Huyện Hạ Hòa",
    "Huyện Lâm Thao", "Huyện Phù Ninh", "Huyện Tam Nông", "Huyện Thanh Ba", "Huyện Thanh Sơn"
  ],
  "Vĩnh Phúc": [
    "TP. Vĩnh Yên", "TP. Phúc Yên", "Huyện Bình Xuyên", "Huyện Lập Thạch", "Huyện Tam Dương",
    "Huyện Tam Đảo", "Huyện Vĩnh Tường", "Huyện Yên Lạc"
  ],
  "Hòa Bình": [
    "TP. Hòa Bình", "Huyện Cao Phong", "Huyện Đà Bắc", "Huyện Kim Bôi", "Huyện Lương Sơn",
    "Huyện Mai Châu", "Huyện Tân Lạc", "Huyện Lạc Sơn"
  ],
  // Thái Nguyên & Bắc Kạn
  "Thái Nguyên": [
    "TP. Thái Nguyên", "TP. Sông Công", "TP. Phổ Yên", "Huyện Đại Từ", "Huyện Định Hóa",
    "Huyện Đồng Hỷ", "Huyện Phú Bình", "Huyện Phú Lương", "Huyện Võ Nhai"
  ],
  "Bắc Kạn": [
    "TP. Bắc Kạn", "Huyện Ba Bể", "Huyện Bạch Thông", "Huyện Chợ Đồn", "Huyện Chợ Mới", "Huyện Na Rì"
  ],
  // Tuyên Quang & Hà Giang
  "Tuyên Quang": [
    "TP. Tuyên Quang", "Huyện Chiêm Hóa", "Huyện Hàm Yên", "Huyện Lâm Bình", "Huyện Na Hang", "Huyện Sơn Dương", "Huyện Yên Sơn"
  ],
  "Hà Giang": [
    "TP. Hà Giang", "Huyện Bắc Quang", "Huyện Đồng Văn", "Huyện Hoàng Su Phì", "Huyện Mèo Vạc", "Huyện Quản Bạ", "Huyện Vị Xuyên"
  ],
  // Lào Cai & Yên Bái
  "Lào Cai": [
    "TP. Lào Cai", "Thị xã Sa Pa", "Huyện Bát Xát", "Huyện Bảo Thắng", "Huyện Bảo Yên", "Huyện Bắc Hà", "Huyện Mường Khương", "Huyện Văn Bàn"
  ],
  "Yên Bái": [
    "TP. Yên Bái", "Thị xã Nghĩa Lộ", "Huyện Lục Yên", "Huyện Mù Căng Chải", "Huyện Trấn Yên", "Huyện Văn Chấn", "Huyện Yên Bình"
  ],
  // Quảng Trị & Quảng Bình
  "Quảng Trị": [
    "TP. Đông Hà", "Thị xã Quảng Trị", "Huyện Cam Lộ", "Huyện Cồn Cỏ", "Huyện Đakrông", "Huyện Gio Linh", "Huyện Hướng Hóa", "Huyện Hải Lăng", "Huyện Triệu Phong", "Huyện Vĩnh Linh"
  ],
  "Quảng Bình": [
    "TP. Đồng Hới", "Thị xã Ba Đồn", "Huyện Bố Trạch", "Huyện Lệ Thủy", "Huyện Minh Hóa", "Huyện Quảng Ninh", "Huyện Quảng Trạch", "Huyện Tuyên Hóa"
  ],
  // Quảng Ngãi & Kon Tum
  "Quảng Ngãi": [
    "TP. Quảng Ngãi", "Thị xã Đức Phổ", "Huyện Bình Sơn", "Huyện Lý Sơn", "Huyện Mộ Đức", "Huyện Nghĩa Hành", "Huyện Sơn Tịnh", "Huyện Tư Nghĩa"
  ],
  "Kon Tum": [
    "TP. Kon Tum", "Huyện Đắk Glei", "Huyện Đắk Hà", "Huyện Đắk Tô", "Huyện Kon Plông", "Huyện Ngọc Hồi", "Huyện Sa Thầy"
  ],
  // Gia Lai & Bình Định
  "Gia Lai": [
    "TP. Pleiku", "Thị xã An Khê", "Thị xã Ayun Pa", "Huyện Chư Păh", "Huyện Chư Prông", "Huyện Chư Sê", "Huyện Đak Đoa", "Huyện Đức Cơ"
  ],
  "Bình Định": [
    "TP. Quy Nhơn", "Thị xã An Nhơn", "Thị xã Hoài Nhơn", "Huyện Phù Cát", "Huyện Phù Mỹ", "Huyện Tuy Phước", "Huyện Tây Sơn"
  ],
  // Khánh Hòa & Ninh Thuận
  "Khánh Hòa": [
    "TP. Nha Trang", "TP. Cam Ranh", "Thị xã Ninh Hòa", "Huyện Vạn Ninh", "Huyện Diên Khánh", "Huyện Cam Lâm", "Huyện Trường Sa"
  ],
  "Ninh Thuận": [
    "TP. Phan Rang - Tháp Chàm", "Huyện Ninh Hải", "Huyện Ninh Phước", "Huyện Ninh Sơn", "Huyện Thuận Bắc", "Huyện Thuận Nam"
  ],
  // Lâm Đồng, Bình Thuận, Đắk Nông
  "Lâm Đồng": [
    "TP. Đà Lạt", "TP. Bảo Lộc", "Huyện Đức Trọng", "Huyện Di Linh", "Huyện Đơn Dương", "Huyện Lâm Hà", "Huyện Lạc Dương", "Huyện Bảo Lâm"
  ],
  "Bình Thuận": [
    "TP. Phan Thiết", "Thị xã La Gi", "Huyện Tuy Phong", "Huyện Bắc Bình", "Huyện Hàm Thuận Bắc", "Huyện Hàm Thuận Nam", "Huyện Phú Quý"
  ],
  "Đắk Nông": [
    "TP. Gia Nghĩa", "Huyện Cư Jút", "Huyện Đắk Glong", "Huyện Đắk Mil", "Huyện Đắk R'lấp", "Huyện Krông Nô"
  ],
  // Đắk Lắk & Phú Yên
  "Đắk Lắk": [
    "TP. Buôn Ma Thuột", "Thị xã Buôn Hồ", "Huyện Cư M'gar", "Huyện Ea H'leo", "Huyện Ea Kar", "Huyện Krông Pắc", "Huyện Krông Năng"
  ],
  "Phú Yên": [
    "TP. Tuy Hòa", "Thị xã Sông Cầu", "Thị xã Đông Hòa", "Huyện Đồng Xuân", "Huyện Phú Hòa", "Huyện Tây Hòa", "Huyện Tuy An"
  ],
  // Đồng Nai & Bình Phước
  "Đồng Nai": [
    "TP. Biên Hòa", "TP. Long Khánh", "Huyện Long Thành", "Huyện Nhơn Trạch", "Huyện Trảng Bom", "Huyện Thống Nhất", "Huyện Vĩnh Cửu"
  ],
  "Bình Phước": [
    "TP. Đồng Xoài", "Thị xã Bình Long", "Thị xã Phước Long", "Thị xã Chơn Thành", "Huyện Bù Đăng", "Huyện Đồng Phú", "Huyện Lộc Ninh"
  ],
  // Tây Ninh & Long An
  "Tây Ninh": [
    "TP. Tây Ninh", "Thị xã Hòa Thành", "Thị xã Trảng Bàng", "Huyện Bến Cầu", "Huyện Châu Thành", "Huyện Gò Dầu", "Huyện Tân Châu"
  ],
  "Long An": [
    "TP. Tân An", "Thị xã Kiến Tường", "Huyện Bến Lức", "Huyện Cần Đước", "Huyện Cần Giuộc", "Huyện Đức Hòa", "Huyện Cần Đước"
  ],
  // Vĩnh Long, Bến Tre, Trà Vinh
  "Vĩnh Long": [
    "TP. Vĩnh Long", "Thị xã Bình Minh", "Huyện Bình Tân", "Huyện Long Hồ", "Huyện Mang Thít", "Huyện Tam Bình", "Huyện Trà Ôn"
  ],
  "Bến Tre": [
    "TP. Bến Tre", "Huyện Ba Tri", "Huyện Bình Đại", "Huyện Châu Thành", "Huyện Chợ Lách", "Huyện Giồng Trôm", "Huyện Mỏ Cày Nam"
  ],
  "Trà Vinh": [
    "TP. Trà Vinh", "Thị xã Duyên Hải", "Huyện Càng Long", "Huyện Cầu Kè", "Huyện Cầu Ngang", "Huyện Tiểu Cần", "Huyện Trà Cú"
  ],
  // Đồng Tháp & Tiền Giang
  "Đồng Tháp": [
    "TP. Cao Lãnh", "TP. Sa Đéc", "TP. Hồng Ngự", "Huyện Cao Lãnh", "Huyện Lai Vung", "Huyện Lấp Vò", "Huyện Tháp Mười"
  ],
  "Tiền Giang": [
    "TP. Mỹ Tho", "TP. Gò Công", "Thị xã Cai Lậy", "Huyện Cái Bè", "Huyện Châu Thành", "Huyện Chợ Gạo"
  ],
  // Cà Mau & Bạc Liêu
  "Cà Mau": [
    "TP. Cà Mau", "Huyện Đầm Dơi", "Huyện Cái Nước", "Huyện Trần Văn Thời", "Huyện Thới Bình", "Huyện Năm Căn", "Huyện Ngọc Hiển"
  ],
  "Bạc Liêu": [
    "TP. Bạc Liêu", "Thị xã Giá Rai", "Huyện Đông Hải", "Huyện Hòa Bình", "Huyện Phước Long", "Huyện Vĩnh Lợi"
  ],
  // An Giang & Kiên Giang
  "An Giang": [
    "TP. Long Xuyên", "TP. Châu Đốc", "Thị xã Tân Châu", "Thị xã Tịnh Biên", "Huyện An Phú", "Huyện Châu Thành", "Huyện Chợ Mới", "Huyện Thoại Sơn"
  ],
  "Kiên Giang": [
    "TP. Rạch Giá", "TP. Hà Tiên", "TP. Phú Quốc", "Huyện An Biên", "Huyện Hòn Đất", "Huyện Kiên Lương", "Huyện Tân Hiệp"
  ],
  // Tỉnh giữ nguyên
  "Quảng Ninh": [
    "TP. Hạ Long", "TP. Móng Cái", "TP. Cẩm Phả", "TP. Uông Bí", "Thị xã Quảng Yên", "Thị xã Đông Triều", "Huyện Vân Đồn", "Huyện Cô Tô"
  ],
  "Thanh Hóa": [
    "TP. Thanh Hóa", "TP. Sầm Sơn", "Thị xã Bỉm Sơn", "Thị xã Nghi Sơn", "Huyện Hoằng Hóa", "Huyện Hậu Lộc", "Huyện Nga Sơn", "Huyện Quảng Xương"
  ],
  "Nghệ An": [
    "TP. Vinh", "Thị xã Cửa Lò", "Thị xã Thái Hòa", "Thị xã Hoàng Mai", "Huyện Diễn Châu", "Huyện Quỳnh Lưu", "Huyện Nghi Lộc", "Huyện Nam Đàn"
  ],
  "Hà Tĩnh": [
    "TP. Hà Tĩnh", "Thị xã Hồng Lĩnh", "Thị xã Kỳ Anh", "Huyện Cẩm Xuyên", "Huyện Can Lộc", "Huyện Nghi Xuân", "Huyện Thạch Hà"
  ],
  "Cao Bằng": [
    "TP. Cao Bằng", "Huyện Bảo Lạc", "Huyện Trùng Khánh", "Huyện Quảng Hòa", "Huyện Hà Quảng", "Huyện Hòa An"
  ],
  "Lạng Sơn": [
    "TP. Lạng Sơn", "Huyện Cao Lộc", "Huyện Chi Lăng", "Huyện Hữu Lũng", "Huyện Lộc Bình", "Huyện Văn Lãng"
  ],
  "Sơn La": [
    "TP. Sơn La", "Huyện Mộc Châu", "Huyện Mai Sơn", "Huyện Thuận Châu", "Huyện Mường La", "Huyện Sông Mã"
  ],
  "Điện Biên": [
    "TP. Điện Biên Phủ", "Thị xã Mường Lay", "Huyện Điện Biên", "Huyện Tuần Giáo", "Huyện Mường Chà"
  ],
  "Lai Châu": [
    "TP. Lai Châu", "Huyện Phong Thổ", "Huyện Tam Đường", "Huyện Tân Uyên", "Huyện Than Uyên"
  ]
};

/**
 * Lấy danh sách Quận / Huyện dựa trên Tỉnh/Thành phố được chọn.
 * Hỗ trợ tra cứu tự động cả theo tên tỉnh mới (Nghị quyết 202) hoặc tên tỉnh cũ.
 */
export function getDistrictsByProvince(provinceName: string): string[] {
  if (!provinceName) return [];

  // 1. Tìm trong NEW_34_PROVINCES
  const matchedNew = NEW_34_PROVINCES.find(
    p => p.name === provinceName || p.shortName === provinceName || provinceName.startsWith(p.shortName)
  );

  if (matchedNew) {
    const list: string[] = [];
    for (const f of matchedNew.formerProvinces) {
      if (DISTRICT_MAP_RAW[f]) {
        list.push(...DISTRICT_MAP_RAW[f]);
      }
    }
    if (list.length > 0) {
      return Array.from(new Set(list));
    }
  }

  // 2. Tìm theo tên tỉnh cũ trực tiếp
  if (DISTRICT_MAP_RAW[provinceName]) {
    return DISTRICT_MAP_RAW[provinceName];
  }

  // 3. Loose search
  for (const [k, v] of Object.entries(DISTRICT_MAP_RAW)) {
    if (provinceName.includes(k) || k.includes(provinceName)) {
      return v;
    }
  }

  return [
    "Quận / Huyện trung tâm",
    "Khu vực nội thành / thị xã",
    "Khu vực ngoại thành / huyện",
    "Khu vực khác"
  ];
}
