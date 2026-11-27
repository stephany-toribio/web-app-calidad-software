package creo.tests;

import creo.support.BaseTest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import static org.junit.jupiter.api.Assertions.fail;

@Tag("controlled-failure")
class ControlledFailureTest extends BaseTest {

    @Test
    void capturaFalloIntencional() {

        driver.get(baseUrl + "/creo/landing");

        wait.until(
            ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("input[type='email']")
            )
        );

        fail("QA18_CONTROLLED_FAILURE");
    }
}
