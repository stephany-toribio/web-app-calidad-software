package creo.support;

import java.net.URI;
import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;

import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;

@org.junit.jupiter.api.extension.ExtendWith(FailureEvidence.class)
public abstract class BaseTest {

    protected WebDriver driver;
    protected WebDriverWait wait;

    protected final String baseUrl =
        System.getProperty(
            "qa.baseUrl",
            "http://frontend"
        );

    @BeforeEach
    void iniciarNavegador() throws Exception {

        String seleniumUrl = System.getProperty(
            "qa.seleniumUrl",
            "http://127.0.0.1:4444"
        );

        ChromeOptions options = new ChromeOptions();

        org.openqa.selenium.logging.LoggingPreferences logs =
            new org.openqa.selenium.logging.LoggingPreferences();

        logs.enable(
            org.openqa.selenium.logging.LogType.BROWSER,
            java.util.logging.Level.ALL
        );

        options.setCapability(
            "goog:loggingPrefs",
            logs
        );


        options.addArguments(
            "--window-size=1440,1000",
            "--disable-notifications",
            "--lang=es-PE"
        );

        driver = new RemoteWebDriver(
            URI.create(seleniumUrl).toURL(),
            options
        );

        driver.manage().timeouts()
            .implicitlyWait(Duration.ZERO);

        driver.manage().timeouts()
            .pageLoadTimeout(Duration.ofSeconds(30));

        driver.manage().timeouts()
            .scriptTimeout(Duration.ofSeconds(15));

        driver.manage().window()
            .setSize(new Dimension(1440, 1000));

        wait = new WebDriverWait(
            driver,
            Duration.ofSeconds(15)
        );
    }

    @AfterEach
    void cerrarNavegador() {

        if (driver != null) {
            try {
                driver.quit();
            } finally {
                driver = null;
            }
        }
    }
}
