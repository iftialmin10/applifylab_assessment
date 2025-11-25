/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

import { AuthField } from "@/components/forms/AuthField";
import { loginSchema, type LoginSchema } from "@/lib/validations/auth";

type LoginErrors = Partial<Record<keyof LoginSchema, string>>;

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginSchema>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
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

    const parsed = loginSchema.safeParse(formData);

    if (!parsed.success) {
      const formatted = Object.entries(
        parsed.error.flatten().fieldErrors
      ).reduce((acc, [key, value]) => {
        if (value?.length) {
          acc[key as keyof LoginSchema] = value[0];
        }
        return acc;
      }, {} as LoginErrors);
      setFieldErrors(formatted);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
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
                acc[key as keyof LoginSchema] = messages[0];
              }
              return acc;
            },
            {} as LoginErrors
          );
          setFieldErrors(formattedErrors);
        }
        setServerError(payload?.message ?? "Login failed. Please try again.");
        return;
      }

      setSuccessMessage(payload?.message ?? "Login successful!");

      setTimeout(() => {
        router.push("/feed");
      }, 1000);
    } catch {
      setServerError("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="_social_login_wrapper _layout_main_wrapper">
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
        <div className="_social_login_wrap">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                <div className="_social_login_left">
                  <div className="_social_login_left_image">
                    <img
                      src="/images/login.png"
                      alt="Image"
                      className="_left_img"
                    />
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                <div className="_social_login_content">
                  <div className="_social_login_left_logo _mar_b28">
                    <img
                      src="/images/logo.svg"
                      alt="Image"
                      className="_left_logo"
                    />
                  </div>
                  <p className="_social_login_content_para _mar_b8">
                    Welcome back
                  </p>
                  <h4 className="_social_login_content_title _titl4 _mar_b50">
                    Login to your account
                  </h4>
                  <button
                    type="button"
                    className="_social_login_content_btn _mar_b40"
                  >
                    <img
                      src="/images/google.svg"
                      alt="Image"
                      className="_google_img"
                    />{" "}
                    <span>Or sign-in with google</span>
                  </button>
                  <div className="_social_login_content_bottom_txt _mar_b40">
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
                  <form className="_social_login_form" onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <AuthField
                          id="email"
                          name="email"
                          label="Email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          error={fieldErrors.email}
                          autoComplete="email"
                        />
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <AuthField
                          id="password"
                          name="password"
                          label="Password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          error={fieldErrors.password}
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                        <div className="form-check _social_login_form_check">
                          <input
                            className="form-check-input _social_login_form_check_input"
                            type="checkbox"
                            name="rememberMe"
                            id="rememberMe"
                            defaultChecked
                          />
                          <label
                            className="form-check-label _social_login_form_check_label"
                            htmlFor="rememberMe"
                          >
                            Remember me
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                        <div className="_social_login_form_left">
                          <p className="_social_login_form_left_para">
                            Forgot password?
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                        <div className="_social_login_form_btn _mar_t40 _mar_b60">
                          <button
                            type="submit"
                            className="_social_login_form_btn_link _btn1"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Processing..." : "Login now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                  <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_login_bottom_txt">
                        <p className="_social_login_bottom_txt_para">
                          Dont have an account?{" "}
                          <Link href="/register">Create New Account</Link>
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
