import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>About ManuConnect</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            ManuConnect is a platform designed to streamline the process of
            connecting creators with manufacturers. Our goal is to simplify the
            manufacturing process, making it easier for creators to bring their
            ideas to life and for manufacturers to find new business
            opportunities.
          </p>
          <h2 className="mt-4 text-lg font-semibold">Our Mission</h2>
          <p>
            We aim to bridge the gap between creativity and manufacturing by
            providing a user-friendly platform that facilitates collaboration,
            transparency, and efficiency in the manufacturing industry.
          </p>
          <h2 className="mt-4 text-lg font-semibold">Features</h2>
          <ul className="list-disc list-inside">
            <li>Easy order management for both creators and manufacturers</li>
            <li>Secure communication channels</li>
            <li>Transparent pricing and timelines</li>
            <li>Access to a network of trusted manufacturers</li>
          </ul>
          <h2 className="mt-4 text-lg font-semibold">Get Involved</h2>
          <p>
            Whether you are a creator looking for manufacturing partners or a
            manufacturer seeking new projects, ManuConnect is here to help you
            succeed. Join us today and be part of a growing community that is
            transforming the way products are made.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;
