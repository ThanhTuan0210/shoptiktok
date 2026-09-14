// Danh mục Đơn vị Hành chính Việt Nam Chuẩn Mới Nhất
// Gồm đầy đủ 63 Tỉnh / Thành phố trực thuộc Trung ương và Quận / Huyện / Thị xã tương ứng

export interface ProvinceItem {
  name: string;
  isCentralCity?: boolean;
}

export const CENTRAL_CITIES: string[] = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Thừa Thiên Huế (TP. Huế)"
];

export const VIETNAM_PROVINCES: string[] = [
  // 6 Thành phố trực thuộc Trung ương
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Thừa Thiên Huế (TP. Huế)",
  // 57 Tỉnh thành theo A - Z
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Tĩnh",
  "Hải Dương",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tiền Giang",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái"
];

export const VIETNAM_DISTRICTS: Record<string, string[]> = {
  "Hà Nội": [
    "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy",
    "Quận Đống Đa", "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Quận Sóc Sơn",
    "Huyện Đông Anh", "Huyện Gia Lâm", "Quận Nam Từ Liêm", "Huyện Thanh Trì", "Quận Bắc Từ Liêm",
    "Huyện Mê Linh", "Quận Hà Đông", "Thị xã Sơn Tây", "Huyện Ba Vì", "Huyện Phúc Thọ",
    "Huyện Đan Phượng", "Huyện Hoài Đức", "Huyện Quốc Oai", "Huyện Thạch Thất", "Huyện Chương Mỹ",
    "Huyện Thanh Oai", "Huyện Thường Tín", "Huyện Phú Xuyên", "Huyện Ứng Hòa", "Huyện Mỹ Đức"
  ],
  "TP. Hồ Chí Minh": [
    "TP. Thủ Đức", "Quận 1", "Quận 3", "Quận 4", "Quận 5",
    "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11",
    "Quận 12", "Quận Bình Thạnh", "Quận Gò Vấp", "Quận Phú Nhuận", "Quận Tân Bình",
    "Quận Tân Phú", "Quận Bình Tân", "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Bình Chánh",
    "Huyện Nhà Bè", "Huyện Cần Giờ"
  ],
  "Đà Nẵng": [
    "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn",
    "Quận Liên Chiểu", "Quận Cẩm Lệ", "Huyện Hòa Vang", "Huyện Hoàng Sa"
  ],
  "Hải Phòng": [
    "Quận Hồng Bàng", "Quận Ngô Quyền", "Quận Lê Chân", "Quận Hải An",
    "Quận Kiến An", "Quận Đồ Sơn", "Quận Dương Kinh", "Thành phố Thủy Nguyên",
    "Huyện An Dương", "Huyện An Lão", "Huyện Kiến Thụy", "Huyện Tiên Lãng",
    "Huyện Vĩnh Bảo", "Huyện Cát Hải", "Huyện Bạch Long Vĩ"
  ],
  "Cần Thơ": [
    "Quận Ninh Kiều", "Quận Ô Môn", "Quận Bình Thủy", "Quận Cái Răng",
    "Quận Thốt Nốt", "Huyện Vĩnh Thạnh", "Huyện Cờ Đỏ", "Huyện Phong Điền", "Huyện Thới Lai"
  ],
  "Thừa Thiên Huế (TP. Huế)": [
    "TP. Huế", "Thị xã Hương Thủy", "Thị xã Hương Trà", "Huyện Phong Điền",
    "Huyện Quảng Điền", "Huyện Phú Vang", "Huyện Phú Lộc", "Huyện A Lưới", "Huyện Nam Đông"
  ],
  "Thái Bình": [
    "TP. Thái Bình", "Huyện Đông Hưng", "Huyện Hưng Hà", "Huyện Kiến Xương",
    "Huyện Quỳnh Phụ", "Huyện Thái Thụy", "Huyện Tiền Hải", "Huyện Vũ Thư"
  ],
  "Bình Dương": [
    "TP. Thủ Dầu Một", "TP. Thuận An", "TP. Dĩ An", "TP. Tân Uyên", "TP. Bến Cát",
    "Huyện Bàu Bàng", "Huyện Bắc Tân Uyên", "Huyện Dầu Tiếng", "Huyện Phú Giáo"
  ],
  "Đồng Nai": [
    "TP. Biên Hòa", "TP. Long Khánh", "Huyện Long Thành", "Huyện Nhơn Trạch",
    "Huyện Trảng Bom", "Huyện Thống Nhất", "Huyện Cẩm Mỹ", "Huyện Vĩnh Cửu",
    "Huyện Xuân Lộc", "Huyện Định Quán", "Huyện Tân Phú"
  ],
  "Quảng Ninh": [
    "TP. Hạ Long", "TP. Cẩm Phả", "TP. Uông Bí", "TP. Móng Cái", "Thị xã Quảng Yên",
    "Thị xã Đông Triều", "Huyện Vân Đồn", "Huyện Tiên Yên", "Huyện Hải Hà",
    "Huyện Đầm Hà", "Huyện Bình Liêu", "Huyện Ba Chẽ", "Huyện Cô Tô"
  ],
  "Bắc Ninh": [
    "TP. Bắc Ninh", "TP. Từ Sơn", "Thị xã Quế Võ", "Thị xã Thuận Thành",
    "Huyện Yên Phong", "Huyện Tiên Du", "Huyện Gia Bình", "Huyện Lương Tài"
  ],
  "Hải Dương": [
    "TP. Hải Dương", "TP. Chí Linh", "Thị xã Kinh Môn", "Huyện Cẩm Giàng",
    "Huyện Bình Giang", "Huyện Gia Lộc", "Huyện Kim Thành", "Huyện Nam Sách",
    "Huyện Ninh Giang", "Huyện Thanh Hà", "Huyện Thanh Miện", "Huyện Tứ Kỳ"
  ],
  "Nam Định": [
    "TP. Nam Định", "Huyện Giao Thủy", "Huyện Hải Hậu", "Huyện Mỹ Lộc",
    "Huyện Nam Trực", "Huyện Nghĩa Hưng", "Huyện Trực Ninh", "Huyện Vụ Bản",
    "Huyện Xuân Trường", "Huyện Ý Yên"
  ],
  "Thanh Hóa": [
    "TP. Thanh Hóa", "TP. Sầm Sơn", "Thị xã Bỉm Sơn", "Thị xã Nghi Sơn",
    "Huyện Hoằng Hóa", "Huyện Hậu Lộc", "Huyện Nga Sơn", "Huyện Hà Trung",
    "Huyện Vĩnh Lộc", "Huyện Yên Định", "Huyện Thọ Xuân", "Huyện Triệu Sơn",
    "Huyện Thiệu Hóa", "Huyện Nông Cống", "Huyện Đông Sơn", "Huyện Quảng Xương"
  ],
  "Nghệ An": [
    "TP. Vinh", "Thị xã Cửa Lò", "Thị xã Thái Hòa", "Thị xã Hoàng Mai",
    "Huyện Diễn Châu", "Huyện Quỳnh Lưu", "Huyện Yên Thành", "Huyện Nghi Lộc",
    "Huyện Hưng Nguyên", "Huyện Nam Đàn", "Huyện Đô Lương", "Huyện Thanh Chương"
  ],
  "Khánh Hòa": [
    "TP. Nha Trang", "TP. Cam Ranh", "Thị xã Ninh Hòa", "Huyện Vạn Ninh",
    "Huyện Diên Khánh", "Huyện Cam Lâm", "Huyện Khánh Vĩnh", "Huyện Khánh Sơn", "Huyện Trường Sa"
  ],
  "Lâm Đồng": [
    "TP. Đà Lạt", "TP. Bảo Lộc", "Huyện Đức Trọng", "Huyện Di Linh",
    "Huyện Đơn Dương", "Huyện Lâm Hà", "Huyện Lạc Dương", "Huyện Bảo Lâm",
    "Huyện Đạ Huoai", "Huyện Đạ Tẻh", "Huyện Cát Tiên", "Huyện Đam Rông"
  ],
  "Bà Rịa - Vũng Tàu": [
    "TP. Vũng Tàu", "TP. Bà Rịa", "Thị xã Phú Mỹ", "Huyện Châu Đức",
    "Huyện Xuyên Mộc", "Huyện Long Điền", "Huyện Đất Đỏ", "Huyện Côn Đảo"
  ],
  "Thái Nguyên": [
    "TP. Thái Nguyên", "TP. Sông Công", "TP. Phổ Yên", "Huyện Đại Từ",
    "Huyện Định Hóa", "Huyện Đồng Hỷ", "Huyện Phú Bình", "Huyện Phú Lương", "Huyện Võ Nhai"
  ],
  "Vĩnh Phúc": [
    "TP. Vĩnh Yên", "TP. Phúc Yên", "Huyện Bình Xuyên", "Huyện Lập Thạch",
    "Huyện Sông Lô", "Huyện Tam Dương", "Huyện Tam Đảo", "Huyện Vĩnh Tường", "Huyện Yên Lạc"
  ],
  "An Giang": [
    "TP. Long Xuyên", "TP. Châu Đốc", "Thị xã Tân Châu", "Thị xã Tịnh Biên",
    "Huyện An Phú", "Huyện Châu Phú", "Huyện Châu Thành", "Huyện Chợ Mới",
    "Huyện Phú Tân", "Huyện Thoại Sơn", "Huyện Tri Tôn"
  ],
  "Bắc Giang": [
    "TP. Bắc Giang", "Thị xã Việt Yên", "Huyện Hiệp Hòa", "Huyện Lạng Giang",
    "Huyện Lục Nam", "Huyện Lục Ngạn", "Huyện Sơn Động", "Huyện Tân Yên", "Huyện Yên Dũng", "Huyện Yên Thế"
  ],
  "Bắc Kạn": [
    "TP. Bắc Kạn", "Huyện Ba Bể", "Huyện Bạch Thông", "Huyện Chợ Đồn",
    "Huyện Chợ Mới", "Huyện Na Rì", "Huyện Ngân Sơn", "Huyện Pác Nặm"
  ],
  "Bạc Liêu": [
    "TP. Bạc Liêu", "Thị xã Giá Rai", "Huyện Đông Hải", "Huyện Hòa Bình",
    "Huyện Hồng Dân", "Huyện Phước Long", "Huyện Vĩnh Lợi"
  ],
  "Bến Tre": [
    "TP. Bến Tre", "Huyện Ba Tri", "Huyện Bình Đại", "Huyện Châu Thành",
    "Huyện Chợ Lách", "Huyện Giồng Trôm", "Huyện Mỏ Cày Bắc", "Huyện Mỏ Cày Nam", "Huyện Thạnh Phú"
  ],
  "Bình Định": [
    "TP. Quy Nhơn", "Thị xã An Nhơn", "Thị xã Hoài Nhơn", "Huyện An Lão",
    "Huyện Hoài Ân", "Huyện Phù Cát", "Huyện Phù Mỹ", "Huyện Tuy Phước", "Huyện Tây Sơn", "Huyện Vân Canh", "Huyện Vĩnh Thạnh"
  ],
  "Bình Phước": [
    "TP. Đồng Xoài", "Thị xã Bình Long", "Thị xã Phước Long", "Thị xã Chơn Thành",
    "Huyện Bù Đăng", "Huyện Bù Đốp", "Huyện Bù Gia Mập", "Huyện Đồng Phú", "Huyện Hớn Quản", "Huyện Lộc Ninh", "Huyện Phú Riềng"
  ],
  "Bình Thuận": [
    "TP. Phan Thiết", "Thị xã La Gi", "Huyện Tuy Phong", "Huyện Bắc Bình",
    "Huyện Hàm Thuận Bắc", "Huyện Hàm Thuận Nam", "Huyện Hàm Tân", "Huyện Đức Linh", "Huyện Tánh Linh", "Huyện Phú Quý"
  ],
  "Cà Mau": [
    "TP. Cà Mau", "Huyện Đầm Dơi", "Huyện Cái Nước", "Huyện Trần Văn Thời",
    "Huyện Thới Bình", "Huyện U Minh", "Huyện Phú Tân", "Huyện Năm Căn", "Huyện Ngọc Hiển"
  ],
  "Cao Bằng": [
    "TP. Cao Bằng", "Huyện Bảo Lạc", "Huyện Bảo Lâm", "Huyện Hạ Lang",
    "Huyện Hà Quảng", "Huyện Hòa An", "Huyện Nguyên Bình", "Huyện Quảng Hòa", "Huyện Thạch An", "Huyện Trùng Khánh"
  ],
  "Đắk Lắk": [
    "TP. Buôn Ma Thuột", "Thị xã Buôn Hồ", "Huyện Buôn Đôn", "Huyện Cư Kuin",
    "Huyện Cư M'gar", "Huyện Ea H'leo", "Huyện Ea Kar", "Huyện Ea Súp", "Huyện Krông Ana", "Huyện Krông Bông", "Huyện Krông Búk", "Huyện Krông Năng", "Huyện Krông Pắc", "Huyện Lắk", "Huyện M'Đrắk"
  ],
  "Đắk Nông": [
    "TP. Gia Nghĩa", "Huyện Cư Jút", "Huyện Đắk Glong", "Huyện Đắk Mil",
    "Huyện Đắk R'lấp", "Huyện Đắk Song", "Huyện Krông Nô", "Huyện Tuy Đức"
  ],
  "Điện Biên": [
    "TP. Điện Biên Phủ", "Thị xã Mường Lay", "Huyện Điện Biên", "Huyện Điện Biên Đông",
    "Huyện Mường Ảng", "Huyện Mường Chà", "Huyện Mường Nhé", "Huyện Nậm Pồ", "Huyện Tủa Chùa", "Huyện Tuần Giáo"
  ],
  "Đồng Tháp": [
    "TP. Cao Lãnh", "TP. Sa Đéc", "TP. Hồng Ngự", "Huyện Cao Lãnh",
    "Huyện Châu Thành", "Huyện Hồng Ngự", "Huyện Lai Vung", "Huyện Lấp Vò", "Huyện Tam Nông", "Huyện Tân Hồng", "Huyện Thanh Bình", "Huyện Tháp Mười"
  ],
  "Gia Lai": [
    "TP. Pleiku", "Thị xã An Khê", "Thị xã Ayun Pa", "Huyện Chư Păh",
    "Huyện Chư Prông", "Huyện Chư Pưh", "Huyện Chư Sê", "Huyện Đak Đoa", "Huyện Đak Pơ", "Huyện Đức Cơ", "Huyện Ia Grai", "Huyện Ia Pa", "Huyện K'Bang", "Huyện Kông Chro", "Huyện Krông Pa", "Huyện Mang Yang", "Huyện Phú Thiện"
  ],
  "Hà Giang": [
    "TP. Hà Giang", "Huyện Bắc Mê", "Huyện Bắc Quang", "Huyện Đồng Văn",
    "Huyện Hoàng Su Phì", "Huyện Mèo Vạc", "Huyện Quản Bạ", "Huyện Quang Bình", "Huyện Vị Xuyên", "Huyện Xín Mần", "Huyện Yên Minh"
  ],
  "Hà Nam": [
    "TP. Phủ Lý", "Thị xã Duy Tiên", "Huyện Bình Lục", "Huyện Kim Bảng",
    "Huyện Lý Nhân", "Huyện Thanh Liêm"
  ],
  "Hà Tĩnh": [
    "TP. Hà Tĩnh", "Thị xã Hồng Lĩnh", "Thị xã Kỳ Anh", "Huyện Cẩm Xuyên",
    "Huyện Can Lộc", "Huyện Đức Thọ", "Huyện Hương Khê", "Huyện Hương Sơn", "Huyện Kỳ Anh", "Huyện Lộc Hà", "Huyện Nghi Xuân", "Huyện Thạch Hà", "Huyện Vũ Quang"
  ],
  "Hậu Giang": [
    "TP. Vị Thanh", "TP. Ngã Bảy", "Thị xã Long Mỹ", "Huyện Châu Thành",
    "Huyện Châu Thành A", "Huyện Phụng Hiệp", "Huyện Vị Thủy", "Huyện Long Mỹ"
  ],
  "Hòa Bình": [
    "TP. Hòa Bình", "Huyện Cao Phong", "Huyện Đà Bắc", "Huyện Kim Bôi",
    "Huyện Lạc Sơn", "Huyện Lạc Thủy", "Huyện Lương Sơn", "Huyện Mai Châu", "Huyện Tân Lạc", "Huyện Yên Thủy"
  ],
  "Hưng Yên": [
    "TP. Hưng Yên", "Thị xã Mỹ Hào", "Huyện Ân Thi", "Huyện Khoái Châu",
    "Huyện Kim Động", "Huyện Phù Cừ", "Huyện Tiên Lữ", "Huyện Văn Giang", "Huyện Văn Lâm", "Huyện Yên Mỹ"
  ],
  "Kiên Giang": [
    "TP. Rạch Giá", "TP. Hà Tiên", "TP. Phú Quốc", "Huyện An Biên",
    "Huyện An Minh", "Huyện Châu Thành", "Huyện Giang Thành", "Huyện Giồng Riềng", "Huyện Gò Quao", "Huyện Hòn Đất", "Huyện Kiên Hải", "Huyện Kiên Lương", "Huyện Tân Hiệp", "Huyện U Minh Thượng", "Huyện Vĩnh Thuận"
  ],
  "Kon Tum": [
    "TP. Kon Tum", "Huyện Đắk Glei", "Huyện Đắk Hà", "Huyện Đắk Tô",
    "Huyện Ia H'Drai", "Huyện Kon Plông", "Huyện Kon Rẫy", "Huyện Ngọc Hồi", "Huyện Sa Thầy", "Huyện Tu Mơ Rông"
  ],
  "Lai Châu": [
    "TP. Lai Châu", "Huyện Mường Tè", "Huyện Nậm Nhùn", "Huyện Phong Thổ",
    "Huyện Sìn Hồ", "Huyện Tam Đường", "Huyện Tân Uyên", "Huyện Than Uyên"
  ],
  "Lạng Sơn": [
    "TP. Lạng Sơn", "Huyện Bắc Sơn", "Huyện Bình Gia", "Huyện Cao Lộc",
    "Huyện Chi Lăng", "Huyện Đình Lập", "Huyện Hữu Lũng", "Huyện Lộc Bình", "Huyện Tràng Định", "Huyện Văn Lãng", "Huyện Văn Quan"
  ],
  "Lào Cai": [
    "TP. Lào Cai", "Thị xã Sa Pa", "Huyện Bát Xát", "Huyện Bảo Thắng",
    "Huyện Bảo Yên", "Huyện Bắc Hà", "Huyện Mường Khương", "Huyện Si Ma Cai", "Huyện Văn Bàn"
  ],
  "Long An": [
    "TP. Tân An", "Thị xã Kiến Tường", "Huyện Bến Lức", "Huyện Cần Đước",
    "Huyện Cần Giuộc", "Huyện Châu Thành", "Huyện Đức Hòa", "Huyện Đức Huệ", "Huyện Mộc Hóa", "Huyện Tân Hưng", "Huyện Tân Thạnh", "Huyện Tân Trụ", "Huyện Thạnh Hóa", "Huyện Thủ Thừa", "Huyện Vĩnh Hưng"
  ],
  "Ninh Bình": [
    "TP. Ninh Bình", "TP. Tam Điệp", "Huyện Gia Viễn", "Huyện Hoa Lư",
    "Huyện Kim Sơn", "Huyện Nho Quan", "Huyện Yên Khánh", "Huyện Yên Mô"
  ],
  "Ninh Thuận": [
    "TP. Phan Rang - Tháp Chàm", "Huyện Bác Ái", "Huyện Ninh Hải", "Huyện Ninh Phước",
    "Huyện Ninh Sơn", "Huyện Thuận Bắc", "Huyện Thuận Nam"
  ],
  "Phú Thọ": [
    "TP. Việt Trì", "Thị xã Phú Thọ", "Huyện Cẩm Khê", "Huyện Đoan Hùng",
    "Huyện Hạ Hòa", "Huyện Lâm Thao", "Huyện Phù Ninh", "Huyện Tam Nông", "Huyện Tân Sơn", "Huyện Thanh Ba", "Huyện Thanh Sơn", "Huyện Thanh Thủy", "Huyện Yên Lập"
  ],
  "Phú Yên": [
    "TP. Tuy Hòa", "Thị xã Sông Cầu", "Thị xã Đông Hòa", "Huyện Đồng Xuân",
    "Huyện Phú Hòa", "Huyện Sơn Hòa", "Huyện Sông Hinh", "Huyện Tây Hòa", "Huyện Tuy An"
  ],
  "Quảng Bình": [
    "TP. Đồng Hới", "Thị xã Ba Đồn", "Huyện Bố Trạch", "Huyện Lệ Thủy",
    "Huyện Minh Hóa", "Huyện Quảng Ninh", "Huyện Quảng Trạch", "Huyện Tuyên Hóa"
  ],
  "Quảng Nam": [
    "TP. Tam Kỳ", "TP. Hội An", "Thị xã Điện Bàn", "Huyện Bắc Trà My",
    "Huyện Duy Xuyên", "Huyện Đại Lộc", "Huyện Đông Giang", "Huyện Hiệp Đức", "Huyện Nam Giang", "Huyện Nam Trà My", "Huyện Nông Sơn", "Huyện Núi Thành", "Huyện Phú Ninh", "Huyện Phước Sơn", "Huyện Quế Sơn", "Huyện Tây Giang", "Huyện Thăng Bình", "Huyện Tiên Phước"
  ],
  "Quảng Ngãi": [
    "TP. Quảng Ngãi", "Thị xã Đức Phổ", "Huyện Ba Tơ", "Huyện Bình Sơn",
    "Huyện Lý Sơn", "Huyện Minh Long", "Huyện Mộ Đức", "Huyện Nghĩa Hành", "Huyện Sơn Hà", "Huyện Sơn Tây", "Huyện Sơn Tịnh", "Huyện Trà Bồng", "Huyện Tư Nghĩa"
  ],
  "Quảng Trị": [
    "TP. Đông Hà", "Thị xã Quảng Trị", "Huyện Cam Lộ", "Huyện Cồn Cỏ",
    "Huyện Đakrông", "Huyện Gio Linh", "Huyện Hướng Hóa", "Huyện Hải Lăng", "Huyện Triệu Phong", "Huyện Vĩnh Linh"
  ],
  "Sóc Trăng": [
    "TP. Sóc Trăng", "Thị xã Ngã Năm", "Thị xã Vĩnh Châu", "Huyện Châu Thành",
    "Huyện Cù Lao Dung", "Huyện Kế Sách", "Huyện Long Phú", "Huyện Mỹ Tú", "Huyện Mỹ Xuyên", "Huyện Thạnh Trị", "Huyện Trần Đề"
  ],
  "Sơn La": [
    "TP. Sơn La", "Huyện Bắc Yên", "Huyện Mai Sơn", "Huyện Mộc Châu",
    "Huyện Mường La", "Huyện Phù Yên", "Huyện Quỳnh Nhai", "Huyện Sông Mã", "Huyện Sốp Cộp", "Huyện Thuận Châu", "Huyện Vân Hồ", "Huyện Yên Châu"
  ],
  "Tây Ninh": [
    "TP. Tây Ninh", "Thị xã Hòa Thành", "Thị xã Trảng Bàng", "Huyện Bến Cầu",
    "Huyện Châu Thành", "Huyện Dương Minh Châu", "Huyện Gò Dầu", "Huyện Tân Biên", "Huyện Tân Châu"
  ],
  "Tiền Giang": [
    "TP. Mỹ Tho", "TP. Gò Công", "Thị xã Cai Lậy", "Huyện Cái Bè",
    "Huyện Cai Lậy", "Huyện Châu Thành", "Huyện Chợ Gạo", "Huyện Gò Công Đông", "Huyện Gò Công Tây", "Huyện Tân Phước", "Huyện Tân Phú Đông"
  ],
  "Trà Vinh": [
    "TP. Trà Vinh", "Thị xã Duyên Hải", "Huyện Càng Long", "Huyện Cầu Kè",
    "Huyện Cầu Ngang", "Huyện Châu Thành", "Huyện Duyên Hải", "Huyện Tiểu Cần", "Huyện Trà Cú"
  ],
  "Tuyên Quang": [
    "TP. Tuyên Quang", "Huyện Chiêm Hóa", "Huyện Hàm Yên", "Huyện Lâm Bình",
    "Huyện Na Hang", "Huyện Sơn Dương", "Huyện Yên Sơn"
  ],
  "Vĩnh Long": [
    "TP. Vĩnh Long", "Thị xã Bình Minh", "Huyện Bình Tân", "Huyện Long Hồ",
    "Huyện Mang Thít", "Huyện Tam Bình", "Huyện Trà Ôn", "Huyện Vũng Liêm"
  ],
  "Yên Bái": [
    "TP. Yên Bái", "Thị xã Nghĩa Lộ", "Huyện Lục Yên", "Huyện Mù Căng Chải",
    "Huyện Trạm Tấu", "Huyện Trấn Yên", "Huyện Văn Chấn", "Huyện Văn Yên", "Huyện Yên Bình"
  ]
};

export function getDistrictsByProvince(province: string): string[] {
  if (!province) return [];
  if (VIETNAM_DISTRICTS[province]) {
    return VIETNAM_DISTRICTS[province];
  }
  // Loose match for TP. Hue or variants
  const matchedKey = Object.keys(VIETNAM_DISTRICTS).find(
    k => k.toLowerCase().includes(province.toLowerCase()) || province.toLowerCase().includes(k.toLowerCase())
  );
  if (matchedKey) return VIETNAM_DISTRICTS[matchedKey];
  return [
    "Quận / Huyện trung tâm",
    "Khu vực nội thành / thị xã",
    "Khu vực ngoại thành / huyện",
    "Khu vực khác"
  ];
}
