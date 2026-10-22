package com.swp391.selfstorage.modules.identity.service;

import com.swp391.selfstorage.modules.identity.dto.RegisterRequest;
import java.time.*;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class RegistrationValidator {
  private final RegistrationAccountService accounts;
  private final PasswordPolicy passwordPolicy;
  private final Clock clock;

  public RegistrationValidator(RegistrationAccountService accounts, PasswordPolicy passwordPolicy, Clock clock) {
    this.accounts = accounts;
    this.passwordPolicy = passwordPolicy;
    this.clock = clock;
  }

  private static final List<String> VALID_PROVINCES = Arrays.asList(
    "001",
    "002",
    "004",
    "006",
    "008",
    "010",
    "011",
    "012",
    "014",
    "015",
    "017",
    "019",
    "020",
    "022",
    "024",
    "025",
    "026",
    "027",
    "030",
    "031",
    "033",
    "034",
    "035",
    "036",
    "037",
    "038",
    "040",
    "042",
    "044",
    "045",
    "046",
    "048",
    "049",
    "051",
    "052",
    "054",
    "056",
    "058",
    "060",
    "062",
    "064",
    "066",
    "067",
    "068",
    "070",
    "072",
    "074",
    "075",
    "077",
    "079",
    "080",
    "082",
    "083",
    "084",
    "086",
    "087",
    "089",
    "091",
    "092",
    "093",
    "094",
    "095",
    "096"
  );

  public void validateRegistrationData(RegisterRequest data) {
    if (data == null) throw new IllegalArgumentException("Thiếu thông tin đăng ký");
    if (
      data.getName() == null ||
      data.getName().trim().length() < 2 ||
      data.getName().trim().length() > 50
    ) {
      throw new IllegalArgumentException("Thông tin không hợp lệ!");
    }

    // Tên tiếng Việt hợp lệ
    String nameRegex =
      "^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\\s]+$";
    if (!Pattern.matches(nameRegex, data.getName().trim())) {
      throw new IllegalArgumentException("Thông tin không hợp lệ!");
    }

    // Optional legacy fields: validated if supplied; not mapped in User.
    if (data.getDob() != null && !data.getDob().isBlank()) {
      LocalDate dob;
      try { dob = LocalDate.parse(data.getDob().trim()); }
      catch (Exception ex) { throw new IllegalArgumentException("Ngày sinh không hợp lệ"); }
      int age = Period.between(dob, LocalDate.now(clock)).getYears();
      if (age < 18 || age > 100) throw new IllegalArgumentException("Tuổi không hợp lệ");
    }
    if (data.getGender() != null && !Set.of("Nam", "Nữ", "Khác").contains(data.getGender())) {
      throw new IllegalArgumentException("Giới tính không hợp lệ");
    }

    // Số điện thoại
    if (data.getPhone() == null) throw new IllegalArgumentException(
      "Thông tin không hợp lệ!"
    );
    String cleanPhone = data.getPhone().replaceAll("[\\s.-]", "");
    if (!cleanPhone.matches("^(03|05|07|08|09)[0-9]{8}$")) {
      throw new IllegalArgumentException("Thông tin không hợp lệ!");
    }

    // Email
    if (data.getEmail() == null) throw new IllegalArgumentException(
      "Thông tin không hợp lệ!"
    );
    String cleanEmail = data.getEmail().trim().toLowerCase(Locale.ROOT);
    if (
      !cleanEmail.matches(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      ) ||
      cleanEmail.contains("..")
    ) {
      throw new IllegalArgumentException("Thông tin không hợp lệ!");
    }
    String domain = cleanEmail.substring(cleanEmail.indexOf("@") + 1);
    List<String> fakeDomains = Arrays.asList(
      "test.com",
      "example.com",
      "fake.com",
      "mailinator.com",
      "tempmail.com",
      "abc.xyz"
    );
    if (fakeDomains.contains(domain)) {
      throw new IllegalArgumentException("Thông tin không hợp lệ!");
    }

    // CCCD
    if (data.getCccd() == null) throw new IllegalArgumentException(
      "Thông tin không hợp lệ!"
    );
    String cleanCccd = data.getCccd().replaceAll("\\s", "");
    if (!cleanCccd.matches("^[0-9]{12}$")) {
      throw new IllegalArgumentException("Thông tin không hợp lệ!");
    }
    String provinceCode = cleanCccd.substring(0, 3);
    if (!VALID_PROVINCES.contains(provinceCode)) {
      throw new IllegalArgumentException("Thông tin không hợp lệ!");
    }

    // Tên đăng nhập
    if (data.getUsername() == null) throw new IllegalArgumentException(
      "Thông tin không hợp lệ!"
    );
    String cleanUsername = data.getUsername().trim().toLowerCase(Locale.ROOT);
    if (
      !cleanUsername.matches("^[a-zA-Z0-9_]{4,20}$") ||
      cleanUsername.matches("^[0-9].*")
    ) {
      throw new IllegalArgumentException("Thông tin không hợp lệ!");
    }

    passwordPolicy.validateRegistration(data.getPassword(), data.getConfirmPassword());
    accounts.requireAvailable(cleanUsername, cleanEmail, cleanPhone);
  }
}
