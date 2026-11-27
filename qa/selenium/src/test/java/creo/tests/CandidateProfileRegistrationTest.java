package creo.tests;

import creo.support.BaseTest;
import creo.pages.LoginPage;
import creo.pages.CandidateProfilePage;
import creo.pages.CandidateRegistrationPage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@Tag("candidate")
class CandidateProfileRegistrationTest extends BaseTest {

    private String variable(String nombre) {

        String valor = System.getenv(nombre);

        assertNotNull(valor);
        assertFalse(valor.isBlank());

        return valor;
    }

    private void captura(String nombre) throws Exception {

        Path directorio = Path.of("target", "qa-evidence");

        Files.createDirectories(directorio);

        Files.write(
            directorio.resolve(nombre + ".png"),
            ((TakesScreenshot) driver)
                .getScreenshotAs(OutputType.BYTES)
        );
    }

    @Test
    void registroCamposObligatoriosVacios() throws Exception {

        CandidateRegistrationPage registro =
            new CandidateRegistrationPage(driver, wait);

        registro.abrir(baseUrl);

        registro.continuar();

        registro.esperarError("El nombre es obligatorio");

        registro.esperarError("El apellido es obligatorio");

        registro.esperarError("El DNI es obligatorio");

        registro.esperarError("El correo es obligatorio");

        assertTrue(registro.permanecePrimerPaso());

        captura("candidate-register-required");
    }

    @Test
    void registroDatosInvalidos() throws Exception {

        CandidateRegistrationPage registro =
            new CandidateRegistrationPage(driver, wait);

        registro.abrir(baseUrl);

        registro.ingresarDatosInvalidos();

        registro.continuar();

        registro.esperarError(
            "El DNI debe tener exactamente 8 dígitos numéricos"
        );

        registro.esperarError("Correo inválido");

        registro.esperarError(
            "Las contraseñas no coinciden"
        );

        assertTrue(registro.permanecePrimerPaso());

        captura("candidate-register-invalid");
    }

    @Test
    void registroDobleEnvioNoAvanzaDosPasos() throws Exception {

        CandidateRegistrationPage registro =
            new CandidateRegistrationPage(driver, wait);

        registro.abrir(baseUrl);

        registro.completarDatosValidos(
            variable("SELENIUM_REG_CORREO"),
            variable("SELENIUM_REG_DNI"),
            variable("SELENIUM_REG_CELULAR"),
            variable("SELENIUM_FIXTURE_PASSWORD")
        );

        captura("candidate-register-valid-step");

        registro.continuarDobleClic();

        registro.esperarEducacion();

        captura("candidate-register-single-advance");

        Process proceso = new ProcessBuilder(
            "python3",
            "scripts/fixtures.py",
            "verificar-registro"
        )
        .redirectErrorStream(true)
        .start();

        if (!proceso.waitFor(60, TimeUnit.SECONDS)) {
            proceso.destroyForcibly();
            fail("Timeout de verificacion del registro");
        }

        assertEquals(0, proceso.exitValue());

        registro.esperarEducacion();

        System.out.println(
            "PASS: Registro parcial no persistido"
        );
    }

    @Test
    void editarPerfilYPersistirCambios() throws Exception {

        String email = variable("SELENIUM_CANDIDATE_EMAIL");

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            email,
            variable("SELENIUM_FIXTURE_PASSWORD")
        );

        login.esperarPerfilCandidato();

        CandidateProfilePage perfil =
            new CandidateProfilePage(driver, wait);

        perfil.esperarPerfil(email);

        captura("candidate-profile-before");

        perfil.abrirEdicion();

        assertTrue(
            perfil.correoProtegido(),
            "El correo no debe ser editable"
        );

        String nombre = "Candidato Validado";

        perfil.cambiarNombre(nombre);

        captura("candidate-profile-edit");

        perfil.guardarCambios();

        perfil.esperarNombre(nombre);

        captura("candidate-profile-saved");

        driver.navigate().refresh();

        perfil.esperarPerfil(email);

        perfil.esperarNombre(nombre);

        captura("candidate-profile-persisted");

        Process proceso = new ProcessBuilder(
            "python3",
            "scripts/fixtures.py",
            "verificar-perfil",
            nombre
        )
        .redirectErrorStream(true)
        .start();

        if (!proceso.waitFor(60, TimeUnit.SECONDS)) {

            proceso.destroyForcibly();

            fail("Timeout de verificacion MySQL");
        }

        assertEquals(
            0,
            proceso.exitValue(),
            "El perfil no coincide con MySQL"
        );

        System.out.println(
            "PASS: Perfil persistido en MySQL"
        );
    }
}
