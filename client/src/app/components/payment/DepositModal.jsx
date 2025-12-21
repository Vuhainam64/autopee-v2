import { useState, useEffect } from "react";
import { Modal, Input, Spin, App } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { FaMoneyBill, FaMoneyCheck } from "react-icons/fa";
import { RiQrScanLine } from "react-icons/ri";
import { post, get } from "../../services/api.js";
import { Logo, MBBank, Sepay } from "../../../assets/payment/index.jsx";

const DepositModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialPaymentRequest = null,
}) => {
  const [amount, setAmount] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(initialPaymentRequest);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const { message: messageApi } = App.useApp();

  // Khi initialPaymentRequest thay đổi, cập nhật paymentRequest
  useEffect(() => {
    if (initialPaymentRequest && isOpen) {
      setPaymentRequest(initialPaymentRequest);
      setAmount(initialPaymentRequest.amount || 10000);
    } else if (!initialPaymentRequest && !isOpen) {
      // Reset khi đóng modal và không có initialPaymentRequest
      setPaymentRequest(null);
      setPaymentStatus(null);
      setAmount(10000);
    }
  }, [initialPaymentRequest, isOpen]);

  // Tính toán thời gian còn lại
  useEffect(() => {
    let intervalId;

    const calculateTimeRemaining = () => {
      if (!paymentRequest?.expiresAt) {
        setTimeRemaining(null);
        return;
      }

      const now = new Date().getTime();
      const expires = new Date(paymentRequest.expiresAt).getTime();
      const remaining = expires - now;

      if (remaining <= 0) {
        setTimeRemaining({ minutes: 0, seconds: 0, expired: true });
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining({ minutes, seconds, expired: false });
    };

    if (paymentRequest?.expiresAt) {
      calculateTimeRemaining();
      intervalId = setInterval(calculateTimeRemaining, 1000); // Update mỗi giây
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentRequest?.expiresAt]);

  // Tạo payment request
  const handleDeposit = async () => {
    if (amount < 10000) {
      messageApi.warning("Số tiền nạp tối thiểu là 50,000 VND");
      return;
    }

    setLoading(true);
    try {
      const response = await post("/payment/deposit", {
        amount: Number(amount),
        description: `Nạp tiền ${amount.toLocaleString("vi-VN")} VND`,
      });

      if (response.success && response.data?.paymentRequest) {
        setPaymentRequest(response.data.paymentRequest);
        messageApi.success("Đã tạo yêu cầu nạp tiền thành công!");
      } else {
        messageApi.error("Tạo yêu cầu nạp tiền thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      messageApi.error(error.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra trạng thái payment
  useEffect(() => {
    let intervalId;

    const checkPaymentStatus = async () => {
      if (!paymentRequest?.paymentCode) return;

      try {
        const response = await get(
          `/payment/deposit/${paymentRequest.paymentCode}/status`
        );

        if (response.success) {
          setPaymentStatus(response.data);

          // Nếu đã thanh toán thành công
          if (response.data.paymentRequest?.status === "completed") {
            messageApi.success(
              `Thanh toán thành công: ${response.data.paymentRequest.amount.toLocaleString(
                "vi-VN"
              )} VND`
            );
            onSuccess?.();
            onClose();
            // Clear interval
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };

    if (paymentRequest?.paymentCode) {
      checkPaymentStatus();
      intervalId = setInterval(checkPaymentStatus, 5000); // Check mỗi 5 giây
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentRequest?.paymentCode, messageApi, onSuccess, onClose]);

  const handleCancel = () => {
    // Nếu có initialPaymentRequest, không reset để có thể mở lại
    if (!initialPaymentRequest) {
      setPaymentRequest(null);
      setPaymentStatus(null);
      setAmount(10000);
    }
    onClose();
  };

  const paymentCode = paymentRequest?.paymentCode || "";
  const status =
    paymentStatus?.paymentRequest?.status ||
    paymentRequest?.status ||
    "pending";
  const expiresAt = paymentRequest?.expiresAt
    ? new Date(paymentRequest.expiresAt).toLocaleString("vi-VN")
    : "Đang cập nhật";
  const createdAt = paymentStatus?.paymentRequest?.createdAt
    ? new Date(paymentStatus.paymentRequest.createdAt).toLocaleString("vi-VN")
    : "Đang cập nhật";

  // Nếu đã có payment request, hiển thị QR code modal
  if (paymentRequest) {
    return (
      <Modal
        title="Thanh toán"
        open={isOpen}
        onCancel={handleCancel}
        footer={null}
        width={900}
        centered
      >
        <div className="flex items-center justify-center bg-slate-100">
          <div className="grid grid-cols-3 min-w-[850px] p-4">
            {/* Left Panel */}
            <div className="bg-orange-500 text-white p-8 space-y-2">
              <div className="pb-8 flex items-center gap-2">
                <img src={Logo} alt="logo" className="h-8" />
                <div className="text-2xl font-bold text-white">AutoPee</div>
              </div>
              <div className="text-xl">Đơn hàng hết hạn vào</div>
              <div className="text-xl font-semibold">{expiresAt}</div>
              {timeRemaining && (
                <div className="text-2xl font-bold mt-2">
                  {timeRemaining.expired ? (
                    <span className="text-red-300">Đã hết hạn</span>
                  ) : (
                    <span>
                      {String(timeRemaining.minutes).padStart(2, "0")}:
                      {String(timeRemaining.seconds).padStart(2, "0")}
                    </span>
                  )}
                </div>
              )}
              <div className="py-8 space-y-4">
                <div className="space-y-2">
                  <div className="text-xl">Nhà cung cấp</div>
                  <div className="text-2xl pl-8">SePay</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FaMoneyBill size={20} />
                    <div className="text-xl">Tổng thanh toán</div>
                  </div>
                  <div className="text-2xl pl-8">
                    {(paymentRequest?.amount || amount).toLocaleString("vi-VN")}{" "}
                    đ
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FaMoneyCheck size={20} />
                    <div className="text-xl">Mã thanh toán</div>
                  </div>
                  <div className="text-lg pl-8 break-all">{paymentCode}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <LoadingOutlined spin />
                    <div className="text-xl">Trạng thái</div>
                  </div>
                  <div className="text-lg pl-8">
                    {status === "completed"
                      ? "Đã thanh toán"
                      : status === "expired"
                      ? "Hết hạn"
                      : status === "cancelled"
                      ? "Đã hủy"
                      : "Đang chờ"}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="bg-white p-6 col-span-2">
              <div className="flex flex-col items-center justify-center p-4 space-y-8 pb-12">
                <div className="text-xl text-orange-500 font-semibold">
                  Quét mã để thanh toán
                </div>
                <img
                  src={`https://qr.sepay.vn/img?acc=VQRQAGAUD6790&bank=MBBank&amount=${
                    paymentRequest?.amount || amount
                  }&des=${paymentCode}`}
                  alt="QR"
                  className="w-64 h-64"
                />
                <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                  <div className="text-center mb-2 text-sm text-gray-600">
                    <div className="font-semibold mb-1">
                      Hướng dẫn nạp tiền:
                    </div>
                    <div>
                      1. Chuyển khoản số tiền:{" "}
                      {(paymentRequest?.amount || amount).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      VND
                    </div>
                    <div>2. Nội dung chuyển khoản: {paymentCode}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      Hệ thống sẽ tự động cập nhật số dư sau 1-2 phút
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <RiQrScanLine size={20} />
                    <div>
                      <div>Sử dụng App ngân hàng hoặc Camera</div>
                    </div>
                  </div>
                  <div>hỗ trợ QR Code để quét mã</div>
                </div>
                <div className="flex items-center justify-center !space-x-2">
                  <Spin />
                  <div>Đang chờ bạn chuyển khoản</div>
                </div>
              </div>
              <div className="mt-8">
                <p className="text-gray-500">Ngày tạo: {createdAt}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // Modal nhập số tiền
  return (
    <Modal
      title="Nạp tiền"
      open={isOpen}
      onOk={handleDeposit}
      onCancel={handleCancel}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
    >
      <div className="space-y-4">
        <p>Vui lòng nhập số tiền bạn muốn nạp (tối thiểu 10,000 VND):</p>
        <Input
          placeholder="Nhập số tiền"
          value={amount}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            setAmount(value ? Number(value) : "");
          }}
          type="number"
          min={10000}
          size="large"
        />
        <div className="text-sm text-gray-500">
          Số tiền tối thiểu: 10,000 VND
        </div>
      </div>
    </Modal>
  );
};

export default DepositModal;
