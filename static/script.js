
// Đợi DOM load xong
document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");
    const resultsDiv = document.getElementById("results");

    const chatBubble = document.getElementById("chatBubble");
    const chatContainer = document.getElementById("chatContainer");
    const chatClose = document.getElementById("chatClose");
    const chatBody = document.getElementById("chatBody");
    const chatInput = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");

    // Biến để lưu trữ kết quả tìm kiếm gần nhất
    let latestSearchResults = [];

    // ==== GỬI YÊU CẦU TÌM NHÀ ====
    if (searchBtn) {
        searchBtn.onclick = async () => {
            const message = searchInput.value.trim();
            if (!message) {
                showNotification("Vui lòng nhập yêu cầu!", "warning");
                return;
            }

            // Hiển thị loading animation
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid rgba(78, 205, 196, 0.3); border-top: 4px solid #4ecdc4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 20px; color: rgba(255,255,255,0.8);">🔍 Đang tìm kiếm...</p>
                </div>
            `;

            try {
                const res = await fetch("/search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message })
                });

                const data = await res.json();

                if (!data.ok) {
                    resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center; padding: 20px;">${data.reply}</p>`;
                    return;
                }

                if (!data.results || data.results.length === 0) {
                    resultsDiv.innerHTML = `<p style="color: #ffa726; text-align: center; padding: 20px;">${data.reply}</p>`;
                    return;
                }

                // Lưu kết quả để chatbot có thể tham khảo
                latestSearchResults = data.results;
                
                // Xóa lịch sử chat khi có kết quả mới
                clearChatHistory();

                resultsDiv.innerHTML = "";
                data.results.forEach((r, index) => {
                    const card = document.createElement("div");
                    card.className = "result-card";
                    card.style.animationDelay = `${index * 0.1}s`;
                    card.innerHTML = `
                        <img src="${r.image_path || '/static/noimage.png'}" alt="Ảnh" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                        <b>${r.Tên}</b><br>
                        📍 ${r["Địa chỉ"]}<br>
                        🛏️ ${r["Số phòng ngủ"]} phòng ngủ<br>
                        💰 Giá: ${r.Gia_fmt}<br>
                        <span class="badge-similarity">
                            🔹 Độ tương đồng: ${Math.round((r.similarity || 0) * 100)}%
                        </span><br>
                        🔗 <a href="${r.URL || '#'}" target="_blank">Xem chi tiết</a>
                    `;
                    resultsDiv.appendChild(card);
                    document.querySelectorAll(".badge-similarity").forEach(badge => {
                        const score = parseInt(badge.dataset.score || "0");
                        if (score >= 80) badge.style.color = "#2ecc71";       
                        else if (score >= 60) badge.style.color = "#f1c40f";   
                        else if (score >= 40) badge.style.color = "#e67e22";   
                        else badge.style.color = "#e74c3c";                    
                    });

                });
                showNotification(`Tìm thấy ${data.results.length} căn phù hợp!`, "success");

            } catch (error) {
                console.error("Search error:", error);
                resultsDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center; padding: 20px;">❌ Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại!</p>`;
            }
        };
    }

    // Thêm CSS cho animation loading
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // ==== XỬ LÝ SỰ KIỆN CHATBOT ====
    if (chatBubble) {
        chatBubble.onclick = () => {
            chatContainer.style.display =
                chatContainer.style.display === "flex" ? "none" : "flex";
            
            if (chatContainer.style.display === "flex") {
                chatInput.focus();
            }
        };
    }
    if (chatClose) {
        chatClose.onclick = () => {
            chatContainer.style.display = "none";
        };
    }
    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    if (searchInput) {
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (searchBtn) {
                    searchBtn.click();
                }
            }
        });
    }
    
    // ⭐️ HÀM MỚI: TẠO VÀ HIỂN THỊ THẺ CĂN HỘ TRONG CHAT
    function renderChatCard(r) {
        if (!r) return;

        // Nội dung thẻ căn hộ
        const cardContent = `
            <div class="chat-card">
                <img src="${r.image_path || '/static/noimage.png'}" alt="${r.Tên}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                <b>${r.Tên}</b>
                <div class="info-line">📍 ${r["Địa chỉ"]}</div>
                <div class="info-line">🛏️ ${r["Số phòng ngủ"]} phòng ngủ</div>
                <div class="info-line">💰 Giá: ${r.Gia_fmt}</div>
                <div class="info-line">🔹 ĐTĐ: ${Math.round((r.similarity || 0) * 100)}%</div>
                <a href="${r.URL || '#'}" target="_blank" class="chat-link">🔗 Xem chi tiết &gt;&gt;</a>
            </div>
            `;
        
        const msgDiv = document.createElement("div");
        msgDiv.className = `msg bot`;
        msgDiv.innerHTML = cardContent;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }


    // Hàm gửi tin nhắn (ĐÃ CHỈNH SỬA ĐỂ XỬ LÝ DANH SÁCH CĂN)
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        addMessage(message, "user");
        chatInput.value = "";
        
        showTypingIndicator();
        
        try {
            const res = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });
            
            const data = await res.json();
            hideTypingIndicator();
            
            if (data.ok) {
                
                // ⭐ BƯỚC 1: KIỂM TRA VÀ HIỂN THỊ TẤT CẢ THẺ CĂN HỘ
                const chosenApartments = data.chosen_apartment_info;
                if (chosenApartments && Array.isArray(chosenApartments) && chosenApartments.length > 0) {
                    
                    // Thêm tin nhắn hướng dẫn/tiêu đề trước
                    if (chosenApartments.length > 1) {
                         addMessage(`🤖 Đây là ${chosenApartments.length} căn hộ nổi bật nhất để bạn tham khảo:`, "bot");
                    } else {
                         addMessage(`🤖 Đây là căn hộ đáng mua nhất mà hệ thống đã chọn:`, "bot");
                    }
                    
                    // Lặp qua danh sách và render từng thẻ riêng biệt
                    chosenApartments.forEach(apt => {
                        renderChatCard(apt);
                    });
                }

                // ⭐ BƯỚC 2: HIỂN THỊ PHẢN HỒI PHÂN TÍCH TỪ GEMINI
                const html = marked.parse(data.reply || "..."); 
                addMessage(html, "bot");
                
            } else {
                addMessage("❌ Có lỗi xảy ra. Vui lòng thử lại!", "bot");
            }
        } catch (error) {
            console.error("Chat error:", error);
            hideTypingIndicator();
            addMessage("❌ Không thể kết nối đến server. Vui lòng thử lại!", "bot");
        }
    }

    // Hàm thêm tin nhắn
    function addMessage(content, type) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `msg ${type}`;
        msgDiv.innerHTML = content;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Hàm hiển thị typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement("div");
        typingDiv.className = "typing-indicator";
        typingDiv.id = "typingIndicator";
        typingDiv.innerHTML = "🤖 Đang suy nghĩ...";
        typingDiv.style.display = "block";
        chatBody.appendChild(typingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Hàm ẩn typing indicator
    function hideTypingIndicator() {
        const typingDiv = document.getElementById("typingIndicator");
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    // Hàm xóa lịch sử chat
    function clearChatHistory() {
        chatBody.innerHTML = `
            <div class="msg bot">
                👋 Xin chào! Tôi là trợ lý AI chuyên về bất động sản. 
                Hãy cho tôi biết bạn cần tư vấn gì nhé!
            </div>
        `;
    }

    // Hàm hiển thị thông báo
    function showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        const colors = {
            success: "linear-gradient(45deg, #4ecdc4, #44a08d)",
            warning: "linear-gradient(45deg, #ffa726, #ff9800)",
            error: "linear-gradient(45deg, #ff6b6b, #f44336)",
            info: "linear-gradient(45deg, #45b7d1, #2196f3)"
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = "slideOutRight 0.3s ease-out";
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    const notificationStyle = document.createElement('style');
    notificationStyle.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(notificationStyle);

    if (sendBtn) {
        sendBtn.onclick = sendMessage;
    }
});
