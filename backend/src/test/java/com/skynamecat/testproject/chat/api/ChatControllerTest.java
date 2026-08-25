package com.skynamecat.testproject.chat.api;

import com.skynamecat.testproject.chat.service.ChatService;
import com.skynamecat.testproject.common.api.ApiExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ChatControllerTest {

    private final ChatService chatService = mock(ChatService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new ChatController(chatService))
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void returnsDocumentedResponseShape() throws Exception {
        String sessionId = UUID.randomUUID().toString();
        String messageId = UUID.randomUUID().toString();
        when(chatService.chat(any())).thenReturn(new ChatResponse(
                sessionId, messageId, "你好呀", "preset", "greeting", new BigDecimal("0.8500")
        ));

        mockMvc.perform(post("/api/v1/chat")
                        .contentType("application/json")
                        .content("{\"message\":\"你好\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.sessionId").value(sessionId))
                .andExpect(jsonPath("$.data.messageId").value(messageId))
                .andExpect(jsonPath("$.data.answer").value("你好呀"))
                .andExpect(jsonPath("$.data.provider").value("preset"))
                .andExpect(jsonPath("$.data.intent").value("greeting"))
                .andExpect(jsonPath("$.data.confidence").value(0.85));
    }

    @Test
    void rejectsBlankMessage() throws Exception {
        mockMvc.perform(post("/api/v1/chat")
                        .contentType("application/json")
                        .content("{\"message\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4001))
                .andExpect(jsonPath("$.data.message").value("message must not be blank"));
    }
}
