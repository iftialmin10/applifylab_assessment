/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

import { AuthField } from "@/components/forms/AuthField";
import { registerSchema, type RegisterSchema } from "@/lib/validations/auth";

type RegisterFormState = RegisterSchema & {
  confirmPassword: string;
};

type RegisterErrors = Partial<Record<keyof RegisterFormState, string>>;

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormState>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setServerError(null);
    setSuccessMessage(null);

    const registerData = {
      email: formData.email,
      password: formData.password,
    };

    const parsed = registerSchema.safeParse(registerData);
    const errors: RegisterErrors = {};

    if (!parsed.success) {
      const parsedErrors = parsed.error.flatten().fieldErrors;
      Object.entries(parsedErrors).forEach(([key, value]) => {
        if (value?.length) {
          errors[key as keyof RegisterFormState] = value[0];
        }
      });
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = await response.json();

      if (!response.ok) {
        const apiErrors = payload?.errors as
          | Record<string, string[]>
          | undefined;
        if (apiErrors) {
          const formattedErrors = Object.entries(apiErrors).reduce(
            (acc, [key, messages]) => {
              if (messages?.length) {
                acc[key as keyof RegisterFormState] = messages[0];
              }
              return acc;
            },
            {} as RegisterErrors
          );
          setFieldErrors(formattedErrors);
        }
        setServerError(
          payload?.message ?? "Registration failed. Please try again."
        );
        return;
      }

      setSuccessMessage(payload?.message ?? "Registration successful!");

      setTimeout(() => {
        router.push("/feed");
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);
      setServerError("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="_social_registration_wrapper _layout_main_wrapper">
        <div className="_shape_one">
          <img src="/images/shape1.svg" alt="" className="_shape_img" />
          <img src="/images/dark_shape.svg" alt="" className="_dark_shape" />
        </div>
        <div className="_shape_two">
          <img src="/images/shape2.svg" alt="" className="_shape_img" />
          <img
            src="/images/dark_shape1.svg"
            alt=""
            className="_dark_shape _dark_shape_opacity"
          />
        </div>
        <div className="_shape_three">
          <img src="/images/shape3.svg" alt="" className="_shape_img" />
          <img
            src="/images/dark_shape2.svg"
            alt=""
            className="_dark_shape _dark_shape_opacity"
          />
        </div>
        <div className="_social_registration_wrap">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                <div className="_social_registration_right">
                  <div className="_social_registration_right_image">
                    <img src="/images/registration.png" alt="Image" />
                  </div>
                  <div className="_social_registration_right_image_dark">
                    <img src="/images/registration1.png" alt="Image" />
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                <div className="_social_registration_content">
                  <div className="_social_registration_right_logo _mar_b28">
                    <img
                      src="/images/logo.svg"
                      alt="Image"
                      className="_right_logo"
                    />
                  </div>
                  <p className="_social_registration_content_para _mar_b8">
                    Get Started Now
                  </p>
                  <h4 className="_social_registration_content_title _titl4 _mar_b50">
                    Registration
                  </h4>
                  <button
                    type="button"
                    className="_social_registration_content_btn _mar_b40"
                  >
                    <img
                      src="/images/google.svg"
                      alt="Image"
                      className="_google_img"
                    />{" "}
                    <span>Register with google</span>
                  </button>
                  <div className="_social_registration_content_bottom_txt _mar_b40">
                    {" "}
                    <span>Or</span>
                  </div>
                  {serverError && (
                    <div
                      className="_form_error _mar_b14"
                      role="alert"
                      aria-live="assertive"
                    >
                      {serverError}
                    </div>
                  )}
                  {successMessage && (
                    <div
                      className="_form_success _mar_b14"
                      role="status"
                      aria-live="polite"
                    >
                      {successMessage}
                    </div>
                  )}
                  <form
                    className="_social_registration_form"
                    onSubmit={handleSubmit}
                  >
                    <div className="row">
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <AuthField
                          id="register-email"
                          name="email"
                          label="Email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          error={fieldErrors.email}
                          autoComplete="email"
                          wrapperClassName="_social_registration_form_input _mar_b14"
                          labelClassName="_social_registration_label _mar_b8"
                          inputClassName="form-control _social_registration_input"
                        />
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <AuthField
                          id="register-password"
                          name="password"
                          label="Password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          error={fieldErrors.password}
                          autoComplete="new-password"
                          wrapperClassName="_social_registration_form_input _mar_b14"
                          labelClassName="_social_registration_label _mar_b8"
                          inputClassName="form-control _social_registration_input"
                        />
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <AuthField
                          id="register-confirm-password"
                          name="confirmPassword"
                          label="Repeat Password"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          error={fieldErrors.confirmPassword}
                          autoComplete="new-password"
                          wrapperClassName="_social_registration_form_input _mar_b14"
                          labelClassName="_social_registration_label _mar_b8"
                          inputClassName="form-control _social_registration_input"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                        <div className="form-check _social_registration_form_check">
                          <input
                            className="form-check-input _social_registration_form_check_input"
                            type="checkbox"
                            name="flexCheckboxDefault"
                            id="flexCheckboxDefault"
                            defaultChecked
                          />
                          <label
                            className="form-check-label _social_registration_form_check_label"
                            htmlFor="flexCheckboxDefault"
                          >
                            I agree to terms & conditions
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                        <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                          <button
                            type="submit"
                            className="_social_registration_form_btn_link _btn1"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Processing..." : "Register now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                  <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_bottom_txt">
                        <p className="_social_registration_bottom_txt_para">
                          Already have an account?{" "}
                          <Link href="/login">Login</Link>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
